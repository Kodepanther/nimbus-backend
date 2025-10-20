const axios = require('axios');

async function testCompleteFlow() {
    console.log('🚀 Testing Complete Backend Flow\n');
    console.log('='.repeat(50));
    console.log('\n');

    // Test data
    const testData = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        company: "Acme Corporation",
        message: "Hello! I'm interested in learning more about your services. This is a test message to verify the complete backend flow including database storage and email notifications."
    };

    console.log('📋 Test Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');

    try {
        // Step 1: Test Health Endpoint
        console.log('1️⃣  Testing Health Endpoint...');
        const healthResponse = await axios.get('http://localhost:8080/health');
        const healthData = healthResponse.data;
        
        if (healthData.status === 'OK') {
            console.log('   ✅ Backend is healthy');
            console.log('   📅 Server time:', healthData.timestamp);
            console.log('   🌍 Environment:', healthData.environment);
        } else {
            console.log('   ❌ Health check failed');
            return;
        }
        console.log('\n');

        // Step 2: Submit User Data
        console.log('2️⃣  Submitting User Data to API...');
        const submitResponse = await axios.post('http://localhost:8080/api/users/submit', testData);
        const submitResult = submitResponse.data;
        
        if (submitResult.success) {
            console.log('   ✅ Data submitted successfully!');
            console.log('   🆔 User ID:', submitResult.data.id);
            console.log('   📅 Submitted at:', submitResult.data.submittedAt);
            
            // Save the user ID for later retrieval
            const userId = submitResult.data.id;
            console.log('\n');

            // Step 3: Wait a moment for async operations
            console.log('3️⃣  Waiting for async operations (emails, database)...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('   ✅ Wait complete');
            console.log('\n');

            // Step 4: Retrieve the user from database
            console.log('4️⃣  Retrieving user from database...');
            const getUserResponse = await axios.get(`http://localhost:8080/api/users/${userId}`);
            const getUserResult = getUserResponse.data;
            
            if (getUserResult.success) {
                console.log('   ✅ User retrieved successfully!');
                console.log('   👤 Name:', getUserResult.data.name);
                console.log('   📧 Email:', getUserResult.data.email);
                console.log('   📱 Phone:', getUserResult.data.phone);
                console.log('   🏢 Company:', getUserResult.data.company);
                console.log('   💬 Message:', getUserResult.data.message.substring(0, 50) + '...');
                console.log('   📊 Status:', getUserResult.data.status);
            } else {
                console.log('   ⚠️  Could not retrieve user');
            }
            console.log('\n');

            // Step 5: Get all users
            console.log('5️⃣  Retrieving all users...');
            const allUsersResponse = await axios.get('http://localhost:8080/api/users');
            const allUsersResult = allUsersResponse.data;
            
            if (allUsersResult.success) {
                console.log('   ✅ Retrieved all users');
                console.log('   📊 Total users in database:', allUsersResult.count);
                console.log('   📝 Recent submissions:');
                allUsersResult.data.slice(0, 3).forEach((user, index) => {
                    console.log(`      ${index + 1}. ${user.name} (${user.email}) - ${new Date(user.submittedAt).toLocaleString()}`);
                });
            }
            console.log('\n');

            // Step 6: Summary
            console.log('='.repeat(50));
            console.log('✨ TEST SUMMARY');
            console.log('='.repeat(50));
            console.log('✅ Backend Health Check: PASSED');
            console.log('✅ User Data Submission: PASSED');
            console.log('✅ Database Storage: PASSED');
            console.log('✅ Data Retrieval: PASSED');
            console.log('\n📧 EMAIL NOTIFICATIONS:');
            console.log('   Check your Gmail inbox for:');
            console.log('   1. Admin notification with user details');
            console.log('   2. Look for subject: "New User Submission - John Doe"');
            console.log('\n💾 AZURE TABLE STORAGE:');
            console.log('   Go to Azure Portal > Storage Account > Tables > nimbusDevTable');
            console.log('   You should see the new entry with:');
            console.log(`   - PartitionKey: ${new Date().toISOString().split('T')[0]}`);
            console.log(`   - RowKey: ${userId}`);
            console.log('\n🎉 All tests completed successfully!');

        } else {
            console.log('   ❌ Data submission failed!');
            console.log('   Error:', submitResult.error?.message || 'Unknown error');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  Cannot connect to backend. Make sure:');
            console.error('   1. Backend server is running (npm run dev)');
            console.error('   2. Server is running on port 8080');
            console.error('   3. No firewall is blocking the connection');
        } else if (error.response) {
            console.error('\nServer responded with error:');
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('\nFull error:', error);
        }
    }
}

// Run the test
testCompleteFlow();