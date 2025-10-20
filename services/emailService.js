const email = require('emailjs');

class EmailService {
    constructor() {
        this.isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        
        if (!this.isConfigured) {
            console.log('⚠️  Email service not configured - missing SMTP credentials');
            return;
        }

        try {
            // Create SMTP client
            this.server = email.server.connect({
                user: process.env.SMTP_USER,
                password: process.env.SMTP_PASSWORD,
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                tls: true
            });

            console.log('✅ Email service initialized successfully with emailjs');
            console.log('   SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
            console.log('   SMTP User:', process.env.SMTP_USER);
            console.log('   Admin Email:', process.env.ADMIN_EMAIL || 'Not set');

        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
            this.isConfigured = false;
        }
    }

    async sendConfirmationEmail(toEmail, userName) {
        if (!this.isConfigured) {
            console.log(`📧 [SKIPPED] Confirmation email to ${toEmail} - email not configured`);
            return;
        }

        try {
            console.log(`📧 Sending confirmation email to ${toEmail}...`);

            const message = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: toEmail,
                subject: 'Thank you for contacting us!',
                attachment: [
                    {
                        data: `
                            <html>
                            <head>
                                <style>
                                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>Thank You!</h1>
                                    </div>
                                    <div class="content">
                                        <h2>Hello ${userName}!</h2>
                                        <p>Thank you for reaching out to us. We have received your information and will get back to you shortly.</p>
                                        <p>Our team typically responds within 24-48 hours during business days.</p>
                                        <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
                                        <br>
                                        <p>Best regards,<br><strong>The Team</strong></p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `,
                        alternative: true
                    }
                ]
            };

            await new Promise((resolve, reject) => {
                this.server.send(message, (err, message) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(message);
                    }
                });
            });

            console.log(`✅ Confirmation email sent successfully to ${toEmail}`);

        } catch (error) {
            console.error(`❌ Failed to send confirmation email to ${toEmail}:`, error.message);
            if (error.message.includes('Invalid login')) {
                console.error('   Authentication failed - check your Gmail App Password');
            }
        }
    }

    async sendAdminNotification(userData) {
        if (!this.isConfigured) {
            console.log(`📧 [SKIPPED] Admin notification - email not configured`);
            return;
        }

        if (!process.env.ADMIN_EMAIL) {
            console.log('📧 [SKIPPED] Admin notification - ADMIN_EMAIL not set in .env');
            return;
        }

        try {
            console.log(`📧 Sending admin notification to ${process.env.ADMIN_EMAIL}...`);

            const message = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: process.env.ADMIN_EMAIL,
                subject: `🔔 New User Submission - ${userData.name}`,
                attachment: [
                    {
                        data: `
                            <html>
                            <head>
                                <style>
                                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; }
                                    .header { background: #667eea; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                                    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
                                    .field { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea; }
                                    .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
                                    .value { color: #333; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h2>🔔 New User Submission</h2>
                                        <p style="margin: 0;">Someone just filled out your landing page form!</p>
                                    </div>
                                    <div class="content">
                                        <div class="field">
                                            <div class="label">👤 Name:</div>
                                            <div class="value">${userData.name}</div>
                                        </div>
                                        <div class="field">
                                            <div class="label">📧 Email:</div>
                                            <div class="value"><a href="mailto:${userData.email}">${userData.email}</a></div>
                                        </div>
                                        <div class="field">
                                            <div class="label">📱 Phone:</div>
                                            <div class="value">${userData.phone || 'Not provided'}</div>
                                        </div>
                                        <div class="field">
                                            <div class="label">🏢 Company:</div>
                                            <div class="value">${userData.company || 'Not provided'}</div>
                                        </div>
                                        <div class="field">
                                            <div class="label">💬 Message:</div>
                                            <div class="value">${userData.message}</div>
                                        </div>
                                        <div class="field">
                                            <div class="label">📅 Submitted At:</div>
                                            <div class="value">${new Date(userData.submittedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `,
                        alternative: true
                    }
                ]
            };

            await new Promise((resolve, reject) => {
                this.server.send(message, (err, message) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(message);
                    }
                });
            });

            console.log(`✅ Admin notification sent successfully to ${process.env.ADMIN_EMAIL}`);

        } catch (error) {
            console.error(`❌ Failed to send admin notification:`, error.message);
            if (error.message.includes('Invalid login')) {
                console.error('   Authentication failed - check your Gmail App Password');
            }
        }
    }
}

module.exports = new EmailService();