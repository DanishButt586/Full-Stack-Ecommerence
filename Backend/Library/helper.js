// Response formatter
const sendResponse = (res, statusCode, success, message, data = null) => {
    const response = {
        success,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    sendResponse(res, statusCode, false, message);
};

// Async handler to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    sendResponse,
    errorHandler,
    asyncHandler,
};
