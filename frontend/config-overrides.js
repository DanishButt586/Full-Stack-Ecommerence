/**
 * Webpack Configuration Override
 * This file helps suppress deprecation warnings from webpack-dev-server
 */

module.exports = function override(config, env) {
    // Suppress webpack deprecation warnings
    if (env === 'development' && config.devServer) {
        // Remove deprecated options
        delete config.devServer.onBeforeSetupMiddleware;
        delete config.devServer.onAfterSetupMiddleware;

        // Use the new setupMiddlewares option
        config.devServer.setupMiddlewares = (middlewares, devServer) => {
            return middlewares;
        };
    }

    return config;
};
