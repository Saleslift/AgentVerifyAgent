import { test, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../src/utils/supabase';

// Test data
const testAgents = {
  agent1: {
    email: 'test.agent1@example.com',
    password: 'Test123!@#',
    role: 'agent'
  },
  agent2: {
    email: 'test.agent2@example.com', 
    password: 'Test123!@#',
    role: 'agent'
  }
};

const testProperties = [
  {
    title: 'Test Property 1',
    description: 'A test property',
    type: 'Apartment',
    contractType: 'Sale',
    price: 1000000,
    location: 'Dubai',
    images: ['https://example.com/image1.jpg'],
    shared: true
  },
  {
    title: 'Test Property 2',
    description: 'Another test property',
    type: 'Villa',
    contractType: 'Rent',
    price: 2000000,
    location: 'Abu Dhabi',
    images: ['https://example.com/image2.jpg'],
    shared: true
  }
];

let agent1Id: string;
let agent2Id: string;
let propertyIds: string[] = [];

// Helper functions
async function createTestUser(email: string, password: string, role: string) {
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  });
  if (error) throw error;
  return user!.id;
}

async function createTestProperty(property: any, agentId: string) {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...property,
      agent_id: agentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function cleanupTestData() {
  // Delete test properties
  if (propertyIds.length > 0) {
    await supabase
      .from('properties')
      .delete()
      .in('id', propertyIds);
  }

  // Delete test users
  for (const id of [agent1Id, agent2Id]) {
    if (id) {
      await supabase.auth.admin.deleteUser(id);
    }
  }
}

// Setup test environment
beforeAll(async () => {
  try {
    // Create test users
    agent1Id = await createTestUser(testAgents.agent1.email, testAgents.agent1.password, testAgents.agent1.role);
    agent2Id = await createTestUser(testAgents.agent2.email, testAgents.agent2.password, testAgents.agent2.role);

    // Create test properties
    for (const property of testProperties) {
      const propertyId = await createTestProperty(property, agent1Id);
      propertyIds.push(propertyId);
    }
  } catch (error) {
    console.error('Error setting up test data:', error);
    await cleanupTestData();
    throw error;
  }
});

afterAll(async () => {
  await cleanupTestData();
});

// Test cases
test('Agent can view marketplace properties', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Get marketplace properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('shared', true)
    .neq('agent_id', agent2Id);

  expect(error).toBeNull();
  expect(properties).toHaveLength(2);
  expect(properties?.map(p => p.title)).toEqual(
    expect.arrayContaining(testProperties.map(p => p.title))
  );
});

test('Agent can add property to their listings', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Add first property to listings
  const { error: addError } = await supabase
    .from('agent_properties')
    .insert({
      property_id: propertyIds[0],
      agent_id: agent2Id,
      status: 'active'
    });

  expect(addError).toBeNull();

  // Verify property was added
  const { data: agentProperties, error: getError } = await supabase
    .from('agent_properties')
    .select('*')
    .eq('agent_id', agent2Id)
    .eq('property_id', propertyIds[0]);

  expect(getError).toBeNull();
  expect(agentProperties).toHaveLength(1);
  expect(agentProperties![0].status).toBe('active');
});

test('Agent cannot add same property twice', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Try to add same property again
  const { error: addError } = await supabase
    .from('agent_properties')
    .insert({
      property_id: propertyIds[0],
      agent_id: agent2Id,
      status: 'active'
    });

  expect(addError).toBeDefined();
  expect(addError!.message).toContain('Property is already in your listings');
});

test('Agent cannot add non-shared property', async () => {
  // Create non-shared property
  const nonSharedProperty = {
    ...testProperties[0],
    shared: false,
    title: 'Non-shared Property'
  };
  const nonSharedId = await createTestProperty(nonSharedProperty, agent1Id);
  propertyIds.push(nonSharedId);

  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Try to add non-shared property
  const { error: addError } = await supabase
    .from('agent_properties')
    .insert({
      property_id: nonSharedId,
      agent_id: agent2Id,
      status: 'active'
    });

  expect(addError).toBeDefined();
  expect(addError!.message).toContain('Property not found or not available');
});

test('Agent can view their added properties', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Get agent's properties
  const { data: properties, error } = await supabase
    .from('agent_properties')
    .select(`
      *,
      property:property_id(*)
    `)
    .eq('agent_id', agent2Id)
    .eq('status', 'active');

  expect(error).toBeNull();
  expect(properties).toHaveLength(1);
  expect(properties![0].property.title).toBe(testProperties[0].title);
});

test('Agent can remove property from their listings', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Remove property
  const { error: removeError } = await supabase
    .from('agent_properties')
    .delete()
    .eq('property_id', propertyIds[0])
    .eq('agent_id', agent2Id);

  expect(removeError).toBeNull();

  // Verify property was removed
  const { data: properties, error: getError } = await supabase
    .from('agent_properties')
    .select('*')
    .eq('agent_id', agent2Id)
    .eq('property_id', propertyIds[0]);

  expect(getError).toBeNull();
  expect(properties).toHaveLength(0);
});

test('Agent can add property again after removing it', async () => {
  // Sign in as agent2
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testAgents.agent2.email,
    password: testAgents.agent2.password
  });
  expect(signInError).toBeNull();

  // Add property back
  const { error: addError } = await supabase
    .from('agent_properties')
    .insert({
      property_id: propertyIds[0],
      agent_id: agent2Id,
      status: 'active'
    });

  expect(addError).toBeNull();

  // Verify property was added
  const { data: properties, error: getError } = await supabase
    .from('agent_properties')
    .select('*')
    .eq('agent_id', agent2Id)
    .eq('property_id', propertyIds[0]);

  expect(getError).toBeNull();
  expect(properties).toHaveLength(1);
});