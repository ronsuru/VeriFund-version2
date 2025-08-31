import { beforeAll, afterAll } from '@jest/globals';
import { cleanupDatabase, seedTestData } from './helpers/testData';

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Clean existing test data
  await cleanupDatabase();
  
  // Seed test data with all user roles
  await seedTestData();
  
  console.log('✅ Test environment ready');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await cleanupDatabase();
  console.log('✅ Test cleanup complete');
});