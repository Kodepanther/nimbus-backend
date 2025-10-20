require('dotenv').config();

async function testStorage() {
    console.log('🔄 Testing Azure Table Storage...\n');
    
    console.log('Storage Settings:');
    console.log('Account:', process.env.AZURE_STORAGE_ACCOUNT_NAME);
    console.log('Table:', process.env.AZURE_TABLE_NAME);
    console.log('\n');

    try {
        // Import after env is loaded
        const tableService = require('./services/tableStorageService');
        
        // Wait a moment for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 1: Create a test user
        console.log('🔄 Creating test user...');
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            company: 'Test Company',
            message: 'This is a test message to verify Azure Table Storage is working',
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        const savedUser = await tableService.createUser(testUser);
        console.log('✅ User created successfully!');
        console.log('User ID:', savedUser.RowKey);
        console.log('Partition Key:', savedUser.PartitionKey);
        console.log('\n');

        // Test 2: Retrieve the user by ID
        console.log('🔄 Retrieving user by ID...');
        const retrievedUser = await tableService.getUserById(savedUser.RowKey);
        if (retrievedUser) {
            console.log('✅ User retrieved successfully!');
            console.log('Name:', retrievedUser.name);
            console.log('Email:', retrievedUser.email);
            console.log('\n');
        }

        // Test 3: Get all users
        console.log('🔄 Retrieving all users...');
        const allUsers = await tableService.getAllUsers();
        console.log('✅ Retrieved', allUsers.length, 'user(s)');
        console.log('\n');

        // Test 4: Delete the test user
        console.log('🔄 Cleaning up - deleting test user...');
        await tableService.deleteUser(savedUser.RowKey);
        console.log('✅ Test user deleted');
        console.log('\n');

        console.log('✨ All tests passed! Azure Table Storage is working correctly.');

    } catch (error) {
        console.error('❌ Storage test failed!');
        console.error('\nError details:', error.message);
        
        if (error.message.includes('credentials')) {
            console.error('\n⚠️  Credential error. Please check:');
            console.error('   1. AZURE_STORAGE_ACCOUNT_NAME is correct');
            console.error('   2. AZURE_STORAGE_ACCOUNT_KEY is correct (no extra spaces)');
            console.error('   3. Storage account exists in Azure Portal');
        }
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n⚠️  Cannot reach Azure. Please check:');
            console.error('   1. Your internet connection');
            console.error('   2. Storage account name is spelled correctly');
        }

        console.error('\nFull error:', error);
    }
}

testStorage();