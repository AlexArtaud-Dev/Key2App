const ts = new Date();
const fs = require('fs');
const open = require('open');
const cors = require('cors');
const https = require('https')
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const db = require('./utils/mongoose');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express")
const serverKey = fs.readFileSync("./SSL_Cert/server.key")
const serverCert = fs.readFileSync("./SSL_Cert/server.cert")
const swaggerOptions = require("./utils/swaggerOptions")
const keyCleaner = require("./utils/keyCleaner")
// const {createUserTest} = require("./test_app");
// Connect to DB
db.init();

// Swagger Docs Route and Options
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/v1/swagger", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Middleware
app.use(express.json());

// Allow Access-Control-Allow-Origin from *
app.use(cors({ origin: '*' }));


// Import Routes

const usersRoute = require('./routes/users');
const productsRoute = require('./routes/products');
const keysRoute = require('./routes/keys');
const authRoute = require('./routes/auth');


// Route Middlewares

app.use('/api/user', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/products', productsRoute);
app.use('/api/keys', keysRoute);

// Server Listening
https.createServer({
    key: serverKey,
    cert: serverCert
}, app)
    .listen(port, function () {
        console.clear();
        console.log(`${ts.toLocaleString()} - App listening on port ${port}! Go to https://localhost:${port}/v1/swagger`)
        // open(`https://localhost:${port}/v1/swagger`, {app: 'firefox'});
        keyCleaner(3600000);
    })
