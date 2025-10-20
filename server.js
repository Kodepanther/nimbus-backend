const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());

// Robust CORS: allow configured list; in development allow any origin for ease of testing
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const parsedAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: isDev ? true : function(origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = parsedAllowedOrigins.includes(origin);
        if (isAllowed) return callback(null, true);
        return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
    allowedHeaders: ['content-type'],
    optionsSuccessStatus: 204
}));

// Ensure preflight requests are handled
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Landing Page API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            submitUser: 'POST /api/users/submit',
            getUsers: 'GET /api/users',
            getUserById: 'GET /api/users/:id'
        }
    });
});

// Routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});

module.exports = app;