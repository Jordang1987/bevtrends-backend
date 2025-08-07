const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = "https://YOUR-RENDER-URL.onrender.com"; // ← replace with your Render backend URL

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔹 Testing ${endpoint}...`);
    const res = await fetch(`${BASE_URL}${endpoint}`);
    const data = await res.json();
    console.log(`✅ ${endpoint} returned ${data.length || Object.keys(data).length} items`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`❌ Error testing ${endpoint}:`, err.message);
  }
}

async function runTests() {
  await testEndpoint("/trending/near-me");
  await testEndpoint("/trending/journal");
  await testEndpoint("/trending/tastemakers");
  await testEndpoint("/sponsored");
}

runTests();
