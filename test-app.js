const puppeteer = require('puppeteer');

async function testApp() {
  console.log('🧪 Testing Air Niugini PMS Application...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigating to http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for data to load...');
    await page.waitForTimeout(5000); // Wait for data to load

    // Check if real data is displayed
    const stats = await page.evaluate(() => {
      const pilots = document.querySelector('[data-testid="total-pilots"]') ||
                    document.evaluate("//p[contains(text(), 'Total Pilots')]/preceding-sibling::*[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      const certifications = document.querySelector('[data-testid="certifications"]') ||
                            document.evaluate("//p[contains(text(), 'Certifications')]/preceding-sibling::*[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      return {
        pilotsText: pilots?.textContent || 'Not found',
        certificationsText: certifications?.textContent || 'Not found',
        title: document.title,
        hasSkeletonLoaders: document.querySelectorAll('.skeleton').length > 0
      };
    });

    console.log('📊 Application Status:');
    console.log(`   Title: ${stats.title}`);
    console.log(`   Pilots Display: ${stats.pilotsText}`);
    console.log(`   Certifications Display: ${stats.certificationsText}`);
    console.log(`   Has Skeleton Loaders: ${stats.hasSkeletonLoaders}`);

    // Test API endpoint
    console.log('\n🔌 Testing API Endpoint...');
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/dashboard/stats');
      return response.json();
    });

    console.log('✅ API Response:', apiResponse);

    if (apiResponse.totalPilots === 27 && apiResponse.certifications === 531) {
      console.log('🎉 SUCCESS: Real data is being served correctly!');
    } else {
      console.log('❌ WARNING: Data might not be real data');
    }

    console.log('\n🌐 Browser will stay open for manual inspection...');
    console.log('   You can now inspect the application manually');
    console.log('   Close the browser window when done');

    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testApp();