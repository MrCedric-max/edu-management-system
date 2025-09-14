const http = require('http');
const https = require('https');

console.log('🧪 Testing Educational Management System...\n');

// Test configuration
const tests = [
    {
        name: 'Backend Health Check',
        url: 'http://localhost:3001/health',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: 'API Test Endpoint',
        url: 'http://localhost:3001/api/test',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: 'Frontend Accessibility',
        url: 'http://localhost:3000',
        method: 'GET',
        expectedStatus: 200
    }
];

// Test database connection
async function testDatabase() {
    console.log('🗄️ Testing database connection...');
    try {
        const db = require('../backend/config/database');
        const result = await db.query('SELECT NOW()');
        if (result && result.rows && result.rows.length > 0) {
            console.log('✅ Database connection successful');
            return true;
        } else {
            console.log('⚠️ Database connection returned empty result');
            return false;
        }
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        console.log('💡 This is expected if PostgreSQL is not running');
        return false;
    }
}

// Test API endpoint
function testEndpoint(test) {
    return new Promise((resolve) => {
        const url = new URL(test.url);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: test.method,
            timeout: 5000
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === test.expectedStatus;
                console.log(`${success ? '✅' : '❌'} ${test.name}: ${res.statusCode}`);
                if (!success) {
                    console.log(`   Expected: ${test.expectedStatus}, Got: ${res.statusCode}`);
                }
                resolve(success);
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${test.name}: ${error.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ ${test.name}: Timeout`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting system tests...\n');
    
    let passed = 0;
    let total = tests.length + 1; // +1 for database test
    
    // Test database
    const dbTest = await testDatabase();
    if (dbTest) passed++;
    
    console.log('\n🌐 Testing API endpoints...');
    
    // Test API endpoints
    for (const test of tests) {
        const result = await testEndpoint(test);
        if (result) passed++;
    }
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! System is ready for deployment.');
        process.exit(0);
    } else {
        console.log('⚠️ Some tests failed. Please check the issues above.');
        process.exit(1);
    }
}

// Check if servers are running
async function checkServers() {
    console.log('🔍 Checking if servers are running...');
    
    const backendRunning = await testEndpoint({
        name: 'Backend Check',
        url: 'http://localhost:3001/health',
        method: 'GET',
        expectedStatus: 200
    });
    
    const frontendRunning = await testEndpoint({
        name: 'Frontend Check',
        url: 'http://localhost:3000',
        method: 'GET',
        expectedStatus: 200
    });
    
    if (!backendRunning) {
        console.log('❌ Backend server is not running. Please start it with: npm run start:backend');
    }
    
    if (!frontendRunning) {
        console.log('❌ Frontend server is not running. Please start it with: npm run start:frontend');
    }
    
    if (!backendRunning || !frontendRunning) {
        console.log('\n💡 To start both servers: npm start');
        process.exit(1);
    }
    
    console.log('✅ Both servers are running');
}

// Main execution
async function main() {
    try {
        await checkServers();
        await runTests();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

main();
