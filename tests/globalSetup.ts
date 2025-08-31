import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Start the browser and create a context for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔧 Running global setup...');
  
  // Wait for server to be ready
  let retries = 0;
  const maxRetries = 60;
  
  while (retries < maxRetries) {
    try {
      const response = await page.goto(baseURL || 'http://localhost:5000');
      if (response?.ok()) break;
    } catch (error) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (retries >= maxRetries) {
    throw new Error('Server failed to start within timeout period');
  }
  
  console.log('✅ Server is ready for testing');
  
  await context.close();
  await browser.close();
}

export default globalSetup;