require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('🔄 Testing email configuration...\n');
    
    console.log('SMTP Settings:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('From:', process.env.SMTP_FROM);
    console.log('Admin:', process.env.ADMIN_EMAIL);
    console.log('\n');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    try {
        // Test 1: Verify connection
        console.log('🔄 Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified!\n');

        // Test 2: Send test email
        console.log('🔄 Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'Test Email - SMTP Configuration ✅',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>✅ Success!</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2>Your SMTP configuration is working correctly!</h2>
                        <p>This test email was sent from your backend application.</p>
                        <p><strong>Configuration Details:</strong></p>
                        <ul>
                            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                            <li>From Email: ${process.env.SMTP_FROM}</li>
                        </ul>
                        <p>You're all set to receive user submissions!</p>
                    </div>
                </div>
            `
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n✨ Check your inbox at:', process.env.ADMIN_EMAIL);

    } catch (error) {
        console.error('❌ Email test failed!');
        console.error('\nError details:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('\n⚠️  Authentication failed. Please check:');
            console.error('   1. Your Gmail address is correct');
            console.error('   2. You\'re using an App Password (not your regular password)');
            console.error('   3. App Password has no spaces (16 characters)');
            console.error('   4. 2-Step Verification is enabled on your Google account');
        }
    }
}

testEmail();