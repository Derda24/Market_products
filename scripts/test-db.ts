import { testDatabase } from '../lib/testDb';
import { populateSampleData } from '../lib/sampleData';

async function main() {
  try {
    console.log('🔍 Step 1: Testing database connection...');
    const testResult = await testDatabase();
    
    if (!testResult.success) {
      throw new Error(`Database test failed: ${testResult.error}`);
    }
    
    console.log('✅ Database test successful');
    console.log('Current data:', testResult);
    
    console.log('\n🌱 Step 2: Populating sample data...');
    const populateResult = await populateSampleData();
    
    if (!populateResult.success) {
      throw new Error(`Sample data population failed: ${populateResult.error}`);
    }
    
    console.log('✅ Sample data populated successfully');
    console.log('Results:', populateResult);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main(); 