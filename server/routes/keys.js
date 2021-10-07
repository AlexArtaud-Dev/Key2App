const router = require('express').Router();
const mongoose = require('mongoose');
require('dotenv').config();
const verify = require('./middlewares/verifyToken');
const jwt = require('jsonwebtoken');
const { User, Key, KeyToken, Product } = require("../models/models");
const uuidKey = require("uuid-apikey");


/**
 * @swagger
 * /keys/{keyID}:
 *   get:
 *      description: Use to get informations about a key
 *      tags:
 *          - Key
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: keyID
 *            schema:
 *              type: integer
 *            required: true
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: Key does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/:keyID', verify, async(req, res) => {
    if(!req.params.keyID) return res.status(400).send("You did not provide any key ID!")
    const key = await Key.findOne({_id: mongoose.Types.ObjectId(req.params.keyID)});
    if (!key) return res.status(400).send("This key does not exist or was deleted!");
    res.status(200).send(key);
})

/**
 * @swagger
 * /keys/UUIDtoKEY:
 *   post:
 *      description: Use to get the usable key from UUID
 *      tags:
 *          - Key
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Key
 *            schema:
 *              type: object
 *              required:
 *                 - keyUUID
 *              properties:
 *                 keyUUID:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: Key does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/UUIDtoKEY', verify, async(req, res) => {
    if(!req.body.keyUUID) return res.status(400).send("You did not provide any key UUID!")
    const key = await Key.findOne({UUID: req.body.keyUUID});
    if (!key) return res.status(400).send("This key does not exist or was deleted!");
    const user = await User.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
    if (!user) return res.status(400).send("The user that tried the request does not exist anymore!");
    if (user._id.toString() !== key.creatorID.toString()) return res.status(401).send("You can't get a key true value if you do not own it!");
    const APIKEY = await uuidKey.toAPIKey(key.UUID);
    res.status(200).send(APIKEY);
})

/**
 * @swagger
 * /keys/activate:
 *   post:
 *      description: Use to activate a key, once done, it will use the key, and you can't stop the expiration timer. You can only change the HWID lock
 *      tags:
 *          - Key
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Key
 *            schema:
 *              type: object
 *              required:
 *                 - key
 *                 - hwidData
 *              properties:
 *                 key:
 *                   type: string
 *                 hwidData:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: Key does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/activate', verify, async(req, res) => {
    if(!req.body.key) return res.status(400).send("You did not provide any key !");
    if(!req.body.hwidData) return res.status(400).send("You did not provide any HWID Data to lock the key !");
    if (!uuidKey.isAPIKey(req.body.key)) return res.status(400).send("The key you provided is not a key from Key2App");
    const UUID = await uuidKey.toUUID(req.body.key);
    if (!UUID) return res.status(500).send("Internal Server Error: An error occurred while converting your key!");
    const key = await Key.findOne({UUID: UUID});
    if (!key) return res.status(400).send("The key format you provided was good, but the key does not exist or was deleted!");
    if (key.used) return res.status(400).send("You cannot activate the same key multiple times");
    key.used = true;
    key.HWID.lockStatus = true;
    key.HWID.HWIDInfo = req.body.hwidData;
    const savedKey = await key.save();
    if (!savedKey) return res.status(500).send("Internal Server Error: An error occurred while trying to activate you key!");
    const token = jwt.sign({_id: savedKey._id, creatorID: savedKey.creatorID, productID: savedKey.productID}, process.env.TOKEN_SECRET);
    if (!token) return res.status(500).send("Internal Server Error: An error occurred while trying to activate you key!");

    const keyToken = new KeyToken({
        token: token,
        keyID: mongoose.Types.ObjectId(savedKey._id)
    })
    const savedKeyToken = await keyToken.save()
    if (!savedKeyToken) return res.status(500).send("Internal Server Error: An error occurred while trying to activate you key!");

    res.status(200).send({message:"Key Activated", connectionToken: savedKeyToken.token});
})

/**
 * @swagger
 * /keys/connect:
 *   post:
 *      description: Allow to connect to our provider and check if the user is authorized
 *      tags:
 *          - Key
 *      parameters:
 *          - in: body
 *            name: Token
 *            schema:
 *              type: object
 *              required:
 *                 - connectionToken
 *              properties:
 *                 connectionToken:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: Key does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/connect', async(req, res) => {
    if(!req.body.connectionToken) return res.status(401).send("Unauthorized !");
    const tokenToCheck = await KeyToken.findOne({token: req.body.connectionToken});
    if (!tokenToCheck) return res.status(401).send("Unauthorized !");
    if (tokenToCheck.token !== req.body.connectionToken) return res.status(401).send("Unauthorized !");
    const infosRequest = await jwt.verify(req.body.connectionToken, process.env.TOKEN_SECRET);
    const infos = await jwt.verify(tokenToCheck.token, process.env.TOKEN_SECRET);
    if (!infos || !infosRequest) return res.status(401).send("Unauthorized !");
    const productToCheck = await Product.findOne({_id: mongoose.Types.ObjectId(infosRequest.productID)});
    if (!productToCheck) return res.status(401).send("Unauthorized ! The product linked to the key does not exist anymore!");
    const creatorToCheck = await User.findOne({_id: mongoose.Types.ObjectId(infosRequest.creatorID)});
    if (!creatorToCheck) return res.status(401).send("Unauthorized ! The user who created the key does not exist anymore so the key was deleted!");
    const keyToCheck = await Key.findOne({_id: mongoose.Types.ObjectId(infosRequest._id)});
    if (!keyToCheck) return res.status(401).send("Unauthorized ! The key does not exist anymore !");
    if (keyToCheck._id.toString() !== tokenToCheck.keyID.toString()) return res.status(401).send("Unauthorized !");
    return res.status(200).send("Connection Successfull");
})


module.exports = router;