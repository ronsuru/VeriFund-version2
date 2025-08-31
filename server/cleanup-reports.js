// Simple cleanup script to delete all fraud reports
// This will be run from the server context where environment variables are available

console.log('🧹 Starting cleanup of fraud reports...');

// This script will be run from the server context
// The actual cleanup will be done through the server's database connection

export async function cleanupAllReports(storage) {
  try {
    console.log('📋 Fetching all fraud reports...');
    
    // Get all fraud reports
    const allReports = await storage.getAllFraudReports();
    console.log(`📊 Found ${allReports.length} fraud reports`);
    
    if (allReports.length === 0) {
      console.log('✅ No reports to clean up');
      return;
    }
    
    // Delete all fraud reports
    console.log('🗑️ Deleting all fraud reports...');
    for (const report of allReports) {
      try {
        await storage.deleteFraudReport(report.id);
        console.log(`✅ Deleted report: ${report.id}`);
      } catch (error) {
        console.error(`❌ Error deleting report ${report.id}:`, error);
      }
    }
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// If running directly, show usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('This script should be run from the server context');
  console.log('Use: await cleanupAllReports(storage) from the server');
}
