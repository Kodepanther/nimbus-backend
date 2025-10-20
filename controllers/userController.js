const tableService = require('../services/tableStorageService');
const emailService = require('../services/emailService');

class UserController {
    async submitUserInfo(req, res, next) {
        try {
            const { name, email, phone, company, message } = req.body;
            
            // Create user object
            const userData = {
                name,
                email,
                phone: phone || '',
                company: company || '',
                message,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            };

            // Save to Azure Table Storage
            const savedUser = await tableService.createUser(userData);

            // Send confirmation email to user
            try {
                await emailService.sendConfirmationEmail(email, name);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue even if email fails
            }

            // Send notification email to admin
            try {
                await emailService.sendAdminNotification(userData);
            } catch (emailError) {
                console.error('Admin notification failed:', emailError);
                // Continue even if email fails
            }

            res.status(201).json({
                success: true,
                message: 'Your information has been submitted successfully',
                data: {
                    id: savedUser.RowKey,
                    submittedAt: savedUser.submittedAt
                }
            });

        } catch (error) {
            console.error('Error in submitUserInfo:', error);
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            
            const users = await tableService.getAllUsers(limit);
            
            res.status(200).json({
                success: true,
                count: users.length,
                data: users
            });

        } catch (error) {
            console.error('Error in getAllUsers:', error);
            next(error);
        }
    }

    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await tableService.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Error in getUserById:', error);
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            
            await tableService.deleteUser(id);

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Error in deleteUser:', error);
            next(error);
        }
    }
}

module.exports = new UserController();