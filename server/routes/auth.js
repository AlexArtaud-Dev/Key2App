const router = require('express').Router();
const mongoose = require("mongoose")
require('dotenv').config();
const qrcode = require("qrcode-generator")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require("../models/models");
const verify = require('./middlewares/verifyToken');
const { loginValidation, registerValidation, loginValidationUsername } = require('../utils/validation');


/**
 * @swagger
 * /user/register:
 *   post:
 *      description: Use to create an account
 *      tags:
 *          - Auth
 *      parameters:
 *          - in: body
 *            name: Account
 *            schema:
 *              type: object
 *              required:
 *                 - username
 *                 - email
 *                 - password
 *                 - passwordConfirmation
 *              properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *                 passwordConfirmation:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfully Created
 *         '400':
 *           description: User Creation Failed
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/register', async(req, res) => {
    // Data Validation
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send({ Error: error.details[0].message });

    // Checking if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email.toLowerCase() })
    if (emailExist) return res.status(400).send({ message: "Email already exist !" })

    if(req.body.username.includes("@")) return res.status(400).send({ message: "An username can't contain @ caracter !" })
    const usernameExist = await User.findOne({ username: req.body.username })
    if (usernameExist) return res.status(400).send({ message: "Username already exist !" })

    // Password Hashing
    if (!req.body.passwordConfirmation) return res.status(400).send({ message: "Missing password confirmation" })
    if (req.body.password !== req.body.passwordConfirmation) return res.status(400).send({ message: "The two password does not match" })

    const passwordStrength = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})")
    if (!passwordStrength.test(req.body.password)) return res.status(400)
        .send({ message: "Your password must at least contain:  1 upper case letter | 1 lower case letter | 1 digit | 1 special caracter | 8 minimum caracters" })

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new User
    const user = new User({
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        password: hashPassword
    });
    try {
        const savedUser = await user.save();
        res.status(200).send({ user: user._id });
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

/**
 * @swagger
 * /user/login:
 *   post:
 *      description: Use to login to an account
 *      tags:
 *          - Auth
 *      parameters:
 *          - in: body
 *            name: Account
 *            schema:
 *              type: object
 *              required:
 *                 - email
 *                 - password
 *              properties:
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfully Connected
 *         '400':
 *           description: Email or password does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/login', async(req, res) => {
    // Data Validation
    if(req.body.email.includes("@")){
        // Log In via email
        const { error } = loginValidation(req.body);
        if (error) return res.status(400).send({ Error: error.details[0].message });

        // Checking if the email is already in the database
        const user = await User.findOne({ email: req.body.email.toLowerCase() })
        if (!user) return res.status(400).send({ message: "Email doesn't exist !" });

        // Checking if password is correct
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).send({ error: "Invalid Password" });

        // Create and assign a token

        const token = jwt.sign({ _id: user.id }, process.env.TOKEN_SECRET);
        res.status(200).send(token);
    }else{
        // Log In via username
        req.body.username = req.body.email;
        delete req.body.email;
        const { error } = loginValidationUsername(req.body);
        if (error) return res.status(400).send({ Error: error.details[0].message });

        // Checking if the email is already in the database
        const user = await User.findOne({ username: req.body.username })
        if (!user) return res.status(400).send({ message: "Username doesn't exist ! (try login with your email)" });

        // Checking if password is correct
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).send({ error: "Invalid Password" });

        // Create and assign a token

        const token = jwt.sign({ _id: user.id }, process.env.TOKEN_SECRET);
        res.status(200).send(token);
    }

})

/**
 * @swagger
 * /user/checkToken:
 *   post:
 *      description: Use to check if a token is valid
 *      tags:
 *          - Auth
 *      security:
 *          - Bearer: []
 *      responses:
 *         '200':
 *           description: Token is valid
 *         '400':
 *           description: Token is not valid
 *         '401':
 *           description: No Token provided
 *         '500':
 *           description: Internal servor error
 */
router.post('/checkToken', async(req, res) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send({ message: "No Token provided" });
    try{
        const user = jwt.verify(token, process.env.TOKEN_SECRET);
        if (user) return res.status(200).send({status: true});
    }catch (e) {
        return res.status(400).send({status: false});
    }



})

/**
 * @swagger
 * /user/generate/qr:
 *   get:
 *      description: Allow connection using only token (with QR Code)
 *      tags:
 *          - Auth
 *      security:
 *          - Bearer: []
 *      responses:
 *         '200':
 *           description: Successfully Generated
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/generate/qr', verify, async(req, res) => {
    if (!req.header("auth-token")) return res.status(400).send("You need to pass an auth-token to generate a QR Code");

    const typeNumber = 0;
    const errorCorrectionLevel = 'H';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(`https://www.manganimes.me/qr/login/${req.header("auth-token")}`);
    qr.make();
    const QRCodeBase64 = qr.createImgTag();
    res.status(200).send(QRCodeBase64.split("\"")[1]);
})

/**
 * @swagger
 * /user/login/qr:
 *   post:
 *      description: Allow connection using only token (with QR Code)
 *      tags:
 *          - Auth
 *      security:
 *          - Bearer: []
 *      responses:
 *         '200':
 *           description: Successfully Connected
 *         '400':
 *           description: You need to pass an auth-token to login
 *         '404':
 *           description: The token is not correct
 *         '500':
 *           description: Internal servor error
 */
router.post('/login/qr', async(req, res) => {
    if (!req.header("auth-token")) return res.status(400).send("You need to pass an auth-token to login");
    const user = jwt.verify(req.header("auth-token"), process.env.TOKEN_SECRET);
    if (!user) return res.status(500).send("A problem occured while decoding the token")
    const dbUser = await User.findOne({ _id: user._id});
    if (!dbUser) return res.status(404).send("Not user associated to this token found")

    const token = jwt.sign({ _id: dbUser._id }, process.env.TOKEN_SECRET);
    res.status(200).send(token);
})

module.exports = router;