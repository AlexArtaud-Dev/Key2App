const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Key2App API",
            contact : {
                name: "AlexArtaud-Dev"
            },
            version: "Alpha 1.0.0",
            servers: ["https://86.221.232.6:5000"]
        },
        basePath: "/api",
        paths : {},
        securityDefinitions: {
            Bearer: {
                in: "header",
                name: "auth-token",
                description: "This token is needed to use logged in features",
                required: true,
                type: "apiKey",
            }
        },
        tags: [
            {
                name: "Auth"
            },
            {
                name: "Product"
            },
            {
                name: "Key"
            },
            {
                name: "User"
            }
        ],
    },
    apis: ["app.js", './routes/*.js']
};
module.exports = swaggerOptions;