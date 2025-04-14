import { test, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../src/utils/supabase';

// Test data
const agencyUser = {
  email: 'test.agency@example.com',
  password: 'Test123!@#',
  role: 'agency',
  companyName: 'Test Agency',
  companyAddress: 'Test Address',
  companyRegNumber: 'REG123',
  agencyPhone: '+971501234567'
};

const developerUser = {
  email: 'test.developer@example.com',
  password: 'Test123!@#',
  role: 'developer',
  developerCompanyName: 'Test Developer',
  developerCompanyAddress: 'Test Address',
  developerPhone: '+971501234568'
};

// Helper function to clean up test users
async function cleanupTestUser(email: string) {
  const { data: { user } } = await supabase.auth.admin.getUserByEmail(email);
  if (user) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}

beforeAll(async () => {
  // Clean up any existing test users
  await cleanupTestUser(agencyUser.email);
  await cleanupTestUser(developerUser.email);
});

afterAll(async () => {
  // Clean up test users
  await cleanupTestUser(agencyUser.email);
  await cleanupTestUser(developerUser.email);
});

// Agency Signup Flow Tests
test('Agency signup with valid data', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: agencyUser.email,
    password: agencyUser.password,
    options: {
      data: {
        role: agencyUser.role,
        company_name: agencyUser.companyName,
        company_reg_number: agencyUser.companyRegNumber
      }
    }
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();
  expect(data.user?.email).toBe(agencyUser.email);
  
  // Verify profile creation
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single();

  expect(profile).toBeDefined();
  expect(profile.agency_name).toBe(agencyUser.companyName);
});

test('Agency signup with invalid password', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'invalid@example.com',
    password: 'weak',
    options: {
      data: {
        role: 'agency'
      }
    }
  });

  expect(error).toBeDefined();
  expect(error?.message).toContain('Password');
});

test('Agency signup with duplicate email', async () => {
  const { error } = await supabase.auth.signUp({
    email: agencyUser.email,
    password: agencyUser.password,
    options: {
      data: {
        role: 'agency'
      }
    }
  });

  expect(error).toBeDefined();
  expect(error?.message).toContain('email');
});

// Developer Signup Flow Tests
test('Developer signup with valid data', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: developerUser.email,
    password: developerUser.password,
    options: {
      data: {
        role: developerUser.role,
        company_name: developerUser.developerCompanyName,
        company_address: developerUser.developerCompanyAddress
      }
    }
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();
  expect(data.user?.email).toBe(developerUser.email);

  // Verify profile creation
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single();

  expect(profile).toBeDefined();
  expect(profile.agency_name).toBe(developerUser.developerCompanyName);
});

// Login Tests
test('Login with valid credentials', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: agencyUser.password
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();
  expect(data.session).toBeDefined();
});

test('Login with invalid credentials', async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'wrongpassword'
  });

  expect(error).toBeDefined();
});

test('Login with unconfirmed email', async () => {
  // Create unconfirmed user
  const { data: { user } } = await supabase.auth.signUp({
    email: 'unconfirmed@example.com',
    password: 'Test123!@#'
  });

  // Attempt to login
  const { error } = await supabase.auth.signInWithPassword({
    email: 'unconfirmed@example.com',
    password: 'Test123!@#'
  });

  expect(error?.message).toContain('email');

  // Cleanup
  if (user) {
    await cleanupTestUser('unconfirmed@example.com');
  }
});

// Password Reset Tests
test('Request password reset', async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(agencyUser.email);
  expect(error).toBeNull();
});

test('Update password', async () => {
  // Sign in first
  await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: agencyUser.password
  });

  const { error } = await supabase.auth.updateUser({
    password: 'NewTest123!@#'
  });

  expect(error).toBeNull();

  // Verify can login with new password
  const { data } = await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'NewTest123!@#'
  });

  expect(data.user).toBeDefined();
});

// Role-Based Access Tests
test('Agency can access agency-only features', async () => {
  // Sign in as agency
  await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'NewTest123!@#'
  });

  // Try to access job postings
  const { error: jobPostingError } = await supabase
    .from('job_postings')
    .select('*');

  expect(jobPostingError).toBeNull();

  // Try to access agency properties
  const { error: propertyError } = await supabase
    .from('agency_properties')
    .select('*');

  expect(propertyError).toBeNull();
});

test('Developer cannot access agency-only features', async () => {
  // Sign in as developer
  await supabase.auth.signInWithPassword({
    email: developerUser.email,
    password: developerUser.password
  });

  // Try to access job postings
  const { error: jobPostingError } = await supabase
    .from('job_postings')
    .insert([{ title: 'Test Job' }]);

  expect(jobPostingError).toBeDefined();

  // Try to access agency properties
  const { error: propertyError } = await supabase
    .from('agency_properties')
    .insert([{ property_id: 'test' }]);

  expect(propertyError).toBeDefined();
});

// Session Management Tests
test('Session persistence', async () => {
  // Sign in
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'NewTest123!@#'
  });

  expect(session).toBeDefined();

  // Get current session
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  expect(currentSession?.access_token).toBe(session?.access_token);
});

test('Session refresh', async () => {
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'NewTest123!@#'
  });

  // Wait for a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Refresh session
  const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

  expect(error).toBeNull();
  expect(refreshedSession?.access_token).not.toBe(session?.access_token);
});

test('Sign out', async () => {
  // Sign in
  await supabase.auth.signInWithPassword({
    email: agencyUser.email,
    password: 'NewTest123!@#'
  });

  // Sign out
  const { error } = await supabase.auth.signOut();
  expect(error).toBeNull();

  // Verify session is cleared
  const { data: { session } } = await supabase.auth.getSession();
  expect(session).toBeNull();
});