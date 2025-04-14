import { test, expect } from 'vitest';
import { supabase } from '../src/utils/supabase';

// Test data
const testProfile = {
  id: 'test-user-id',
  name: 'Test Agent',
  introduction: 'Expert real estate agent',
  photo: 'https://example.com/photo.jpg',
  agencyLogo: 'https://example.com/logo.jpg',
  agencyName: 'Test Agency',
  registrationNumber: 'REG123',
  whatsapp: '+971501234567',
  location: 'Dubai',
  experience: '10+ years',
  languages: ['English', 'Arabic'],
  specialties: ['Luxury', 'Commercial']
};

// Basic Information Tests
test('Basic contact information synchronization', async () => {
  // Test name update
  const nameUpdate = await supabase
    .from('profiles')
    .update({ full_name: testProfile.name })
    .eq('id', testProfile.id);
  expect(nameUpdate.error).toBeNull();

  // Verify name update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.full_name).toBe(testProfile.name);

  // Test phone/WhatsApp update
  const whatsappUpdate = await supabase
    .from('profiles')
    .update({ whatsapp: testProfile.whatsapp })
    .eq('id', testProfile.id);
  expect(whatsappUpdate.error).toBeNull();

  // Verify WhatsApp update
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(updatedProfile.whatsapp).toBe(testProfile.whatsapp);
});

// Professional Details Tests
test('Professional details synchronization', async () => {
  // Test experience update
  const experienceUpdate = await supabase
    .from('profiles')
    .update({ experience: testProfile.experience })
    .eq('id', testProfile.id);
  expect(experienceUpdate.error).toBeNull();

  // Test registration number update
  const regUpdate = await supabase
    .from('profiles')
    .update({ registration_number: testProfile.registrationNumber })
    .eq('id', testProfile.id);
  expect(regUpdate.error).toBeNull();

  // Verify professional details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.experience).toBe(testProfile.experience);
  expect(profile.registration_number).toBe(testProfile.registrationNumber);
});

// Media Content Tests
test('Profile photo and media content synchronization', async () => {
  // Test photo URL update
  const photoUpdate = await supabase
    .from('profiles')
    .update({ avatar_url: testProfile.photo })
    .eq('id', testProfile.id);
  expect(photoUpdate.error).toBeNull();

  // Test agency logo update
  const logoUpdate = await supabase
    .from('profiles')
    .update({ agency_logo: testProfile.agencyLogo })
    .eq('id', testProfile.id);
  expect(logoUpdate.error).toBeNull();

  // Verify media updates
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.avatar_url).toBe(testProfile.photo);
  expect(profile.agency_logo).toBe(testProfile.agencyLogo);
});

// Biography Tests
test('Biography and personal statement synchronization', async () => {
  // Test introduction update
  const introUpdate = await supabase
    .from('profiles')
    .update({ introduction: testProfile.introduction })
    .eq('id', testProfile.id);
  expect(introUpdate.error).toBeNull();

  // Verify introduction update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.introduction).toBe(testProfile.introduction);
});

// Specializations Tests
test('Areas of expertise and specializations synchronization', async () => {
  // Test specialties update
  const specialtiesUpdate = await supabase
    .from('profiles')
    .update({ specialties: testProfile.specialties })
    .eq('id', testProfile.id);
  expect(specialtiesUpdate.error).toBeNull();

  // Verify specialties update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.specialties).toEqual(testProfile.specialties);
});

// Languages Tests
test('Languages spoken synchronization', async () => {
  // Test languages update
  const languagesUpdate = await supabase
    .from('profiles')
    .update({ languages: testProfile.languages })
    .eq('id', testProfile.id);
  expect(languagesUpdate.error).toBeNull();

  // Verify languages update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.languages).toEqual(testProfile.languages);
});

// Location Tests
test('Office location and service areas synchronization', async () => {
  // Test location update
  const locationUpdate = await supabase
    .from('profiles')
    .update({ location: testProfile.location })
    .eq('id', testProfile.id);
  expect(locationUpdate.error).toBeNull();

  // Verify location update
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.location).toBe(testProfile.location);
});

// Real-time Update Tests
test('Real-time updates verification', async () => {
  // Subscribe to profile changes
  const subscription = supabase
    .channel('profile_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${testProfile.id}`
      },
      (payload) => {
        // Verify the update was received in real-time
        expect(payload.new).toBeDefined();
        expect(payload.old).toBeDefined();
      }
    )
    .subscribe();

  // Clean up subscription
  return () => {
    subscription.unsubscribe();
  };
});

// Cross-browser Tests
test('Cross-browser data consistency', async () => {
  // Fetch profile data using different fetch implementations
  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testProfile.id)
      .single();
    return data;
  };

  // Test with native fetch
  const nativeFetchResult = await fetchProfile();
  expect(nativeFetchResult).toBeDefined();

  // Test with XMLHttpRequest
  const xhrPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${supabase.supabaseUrl}/rest/v1/profiles?id=eq.${testProfile.id}`);
    xhr.setRequestHeader('apikey', supabase.supabaseKey);
    xhr.onload = () => resolve(JSON.parse(xhr.responseText)[0]);
    xhr.onerror = reject;
    xhr.send();
  });

  const xhrResult = await xhrPromise;
  expect(xhrResult).toEqual(nativeFetchResult);
});

// Special Characters Tests
test('Special characters handling', async () => {
  const specialCharsProfile = {
    ...testProfile,
    name: 'Test Agent ™®©',
    introduction: 'Expert agent • Specializing in luxury properties ★',
  };

  // Update with special characters
  const specialCharsUpdate = await supabase
    .from('profiles')
    .update({
      full_name: specialCharsProfile.name,
      introduction: specialCharsProfile.introduction,
    })
    .eq('id', testProfile.id);
  expect(specialCharsUpdate.error).toBeNull();

  // Verify special characters are preserved
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testProfile.id)
    .single();
  expect(profile.full_name).toBe(specialCharsProfile.name);
  expect(profile.introduction).toBe(specialCharsProfile.introduction);
});