const errorHandler = (err, req, res, next) => {
    console.error('Error Details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                details: err.details 
            })
        }
    });
};

module.exports = { errorHandler };