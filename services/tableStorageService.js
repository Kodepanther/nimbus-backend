const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

class TableStorageService {
    constructor() {
        const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const tableName = process.env.AZURE_TABLE_NAME || 'Users';

        if (!accountName || !accountKey) {
            // Local-friendly fallback: run in memory if Azure creds are missing
            this.isConfigured = false;
            this.memory = [];
            this.tableName = tableName;
            console.log('⚠️  Azure Storage not configured - using in-memory storage for local development');
            return;
        }

        try {
            // Create credentials
            const credential = new AzureNamedKeyCredential(accountName, accountKey);
            
            // Create table client
            this.tableClient = new TableClient(
                `https://${accountName}.table.core.windows.net`,
                tableName,
                credential
            );

            this.tableName = tableName;
            this.isConfigured = true;
            this.initialize();
            
        } catch (error) {
            console.error('Error creating Table Storage client:', error);
            throw error;
        }
    }

    async initialize() {
        if (!this.isConfigured) {
            return;
        }
        try {
            // Create table if it doesn't exist
            await this.tableClient.createTable();
            console.log(`✅ Table Storage initialized: ${this.tableName}`);
        } catch (error) {
            if (error.statusCode === 409) {
                console.log(`✅ Table already exists: ${this.tableName}`);
            } else {
                console.error('Error initializing Table Storage:', error);
                throw error;
            }
        }
    }

    async createUser(userData) {
        try {
            // Generate unique ID
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substr(2, 9);
            const userId = `user_${timestamp}_${randomStr}`;

            const partitionKey = new Date().toISOString().split('T')[0];

            if (!this.isConfigured) {
                // In-memory store
                const record = {
                    id: userId,
                    partitionKey: partitionKey,
                    ...userData
                };
                this.memory.push(record);
                console.log(`✅ [MEM] User created: ${userId}`);
                return {
                    RowKey: userId,
                    PartitionKey: partitionKey,
                    ...userData
                };
            }

            const entity = {
                partitionKey: partitionKey,
                rowKey: userId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                company: userData.company || '',
                message: userData.message,
                submittedAt: userData.submittedAt,
                status: userData.status || 'pending'
            };

            await this.tableClient.createEntity(entity);
            
            console.log(`✅ User created: ${userId}`);
            
            return {
                RowKey: userId,
                PartitionKey: entity.partitionKey,
                ...userData
            };

        } catch (error) {
            console.error('Error creating user in Table Storage:', error);
            throw new Error('Failed to save user data');
        }
    }

    async getAllUsers(limit = 50) {
        try {
            if (!this.isConfigured) {
                const users = [...this.memory]
                    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                    .slice(0, limit)
                    .map(u => ({
                        id: u.id,
                        partitionKey: u.partitionKey,
                        name: u.name,
                        email: u.email,
                        phone: u.phone,
                        company: u.company,
                        message: u.message,
                        submittedAt: u.submittedAt,
                        status: u.status
                    }));
                return users;
            }
            const users = [];
            const entities = this.tableClient.listEntities({
                queryOptions: { 
                    select: ['partitionKey', 'rowKey', 'name', 'email', 'phone', 'company', 'message', 'submittedAt', 'status']
                }
            });

            let count = 0;
            for await (const entity of entities) {
                if (count >= limit) break;
                
                users.push({
                    id: entity.rowKey,
                    partitionKey: entity.partitionKey,
                    name: entity.name,
                    email: entity.email,
                    phone: entity.phone,
                    company: entity.company,
                    message: entity.message,
                    submittedAt: entity.submittedAt,
                    status: entity.status
                });
                
                count++;
            }

            users.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            return users;

        } catch (error) {
            console.error('Error fetching users from Table Storage:', error);
            throw new Error('Failed to retrieve users');
        }
    }

    async getUserById(userId) {
        try {
            if (!this.isConfigured) {
                const found = this.memory.find(u => u.id === userId);
                return found ? {
                    id: found.id,
                    partitionKey: found.partitionKey,
                    name: found.name,
                    email: found.email,
                    phone: found.phone,
                    company: found.company,
                    message: found.message,
                    submittedAt: found.submittedAt,
                    status: found.status
                } : null;
            }
            const entities = this.tableClient.listEntities({
                queryOptions: {
                    filter: `RowKey eq '${userId}'`
                }
            });

            for await (const entity of entities) {
                return {
                    id: entity.rowKey,
                    partitionKey: entity.partitionKey,
                    name: entity.name,
                    email: entity.email,
                    phone: entity.phone,
                    company: entity.company,
                    message: entity.message,
                    submittedAt: entity.submittedAt,
                    status: entity.status
                };
            }

            return null;

        } catch (error) {
            console.error('Error fetching user by ID from Table Storage:', error);
            throw new Error('Failed to retrieve user');
        }
    }

    async updateUser(userId, partitionKey, updateData) {
        try {
            if (!this.isConfigured) {
                const idx = this.memory.findIndex(u => u.id === userId && u.partitionKey === partitionKey);
                if (idx === -1) throw new Error('User not found');
                this.memory[idx] = { ...this.memory[idx], ...updateData };
                return this.memory[idx];
            }
            const existingUser = await this.tableClient.getEntity(partitionKey, userId);
            
            const updatedEntity = {
                partitionKey: partitionKey,
                rowKey: userId,
                ...existingUser,
                ...updateData
            };

            await this.tableClient.updateEntity(updatedEntity, 'Merge');
            
            return updatedEntity;

        } catch (error) {
            console.error('Error updating user in Table Storage:', error);
            throw new Error('Failed to update user');
        }
    }

    async deleteUser(userId) {
        try {
            if (!this.isConfigured) {
                const before = this.memory.length;
                this.memory = this.memory.filter(u => u.id !== userId);
                if (this.memory.length === before) {
                    throw new Error('User not found');
                }
                console.log(`✅ [MEM] User deleted: ${userId}`);
                return true;
            }
            const user = await this.getUserById(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            await this.tableClient.deleteEntity(user.partitionKey, userId);
            
            console.log(`✅ User deleted: ${userId}`);
            return true;

        } catch (error) {
            console.error('Error deleting user from Table Storage:', error);
            throw new Error('Failed to delete user');
        }
    }
}

module.exports = new TableStorageService();