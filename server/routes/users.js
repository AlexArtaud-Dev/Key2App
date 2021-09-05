const router = require('express').Router();
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const verify = require('./middlewares/verifyToken');
const verifyAdmin = require('./middlewares/verifyAdminToken');
const { User, Key, Product } = require("../models/models");
const { userUpdateValidation } = require('../utils/validation');


/**
 * @swagger
 * /users/:
 *   get:
 *      description: Use to get user informations from auth-token
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: User does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/', verify, async(req, res) => {
    const user = await User.findOne({ _id: req.user._id })
    if (!user) return res.status(400).send({ message: "User does not exist" });
    res.status(200).send(user);
})

/**
 * @swagger
 * /users/invites/{userID}:
 *   get:
 *      description: Use to get user pending products invites from auth-token | or from a given userID [ADMIN ONLY]
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: userID
 *            schema:
 *              type: integer
 *            required: false
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: User does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/invites/:userID', verify, async(req, res) => {
    if (req.params.userID !== 'undefined' && req.params.userID !== null && req.params.userID !== "{userID}"){
        const user = await User.findOne({ _id: req.user._id })
        const userToGet = await User.findOne({ _id: req.params.userID })
        if (!user) return res.status(400).send("The token you used is not linked to an existing user" );
        if (user.authority !== 10) return res.status(401).send("You can't check another user pending invites if you are not administrator!" );
        if (userToGet.pendingInvites.length === 0) return res.status(200).send("The user currently has no pending invites");
        res.status(200).send(userToGet.pendingInvites);
    }else{
        const user = await User.findOne({ _id: req.user._id })
        if (!user) return res.status(400).send("The token you used is not linked to an existing user");
        if (user.pendingInvites.length === 0) return res.status(200).send("You currently have no pending invites");
        res.status(200).send(user.pendingInvites);
    }
})

/**
 * @swagger
 * /users/ownedProducts/{userID}:
 *   get:
 *      description: Use to get user owned products invites from auth-token | or from a given userID [ADMIN ONLY]
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: userID
 *            schema:
 *              type: integer
 *            required: false
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: User does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/ownedProducts/:userID', verify, async(req, res) => {
    if (req.params.userID !== 'undefined' && req.params.userID !== null && req.params.userID !== "{userID}"){
        const user = await User.findOne({ _id: req.user._id })
        const userToGet = await User.findOne({ _id: req.params.userID })
        if (!user) return res.status(400).send("The token you used is not linked to an existing user" );
        if (user.authority !== 10) return res.status(401).send("You can't check another user owned products if you are not administrator!" );
        if (userToGet.ownedProducts.length === 0) return res.status(200).send("The user currently has no owned products");
        res.status(200).send(userToGet.ownedProducts);
    }else{
        const user = await User.findOne({ _id: req.user._id })
        if (!user) return res.status(400).send("The token you used is not linked to an existing user");
        if (user.ownedProducts.length === 0) return res.status(200).send("You currently have no owned products");
        res.status(200).send(user.ownedProducts);
    }
})

/**
 * @swagger
 * /users/search:
 *   post:
 *      description: Use to search for user with letter or name or email
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Users
 *            schema:
 *              type: object
 *              required:
 *                 - username
 *                 - email
 *                 - letter
 *              properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 letter:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: You can only search by one parameter (username, email or letter)
 *         '401':
 *           description: Unauthorized
 *         '404':
 *           description: Nothing Found
 *         '500':
 *           description: Internal servor error
 */
router.post('/search', verify, async(req, res) => {
    if (!req.body.username && req.body.email && req.body.letter) return res.status(400).send({ message: "Search can't be empty" });
    if (((req.body.username && req.body.email) || (req.body.username && req.body.letter) || (req.body.letter && req.body.email))){
        res.status(400).send("You can only search by one parameter (username, email or letter)")
    }
    let users;
    if (req.body.username){
        const usersArray = [];
        let usersFound = await User.find({ username: { $regex: `^.*${req.body.username}.*$` } })
        if (usersFound){
            usersFound.forEach(user => {
                if (req.user._id.toString() !== user._id.toString()) {
                    usersArray.push({
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        authority: user.authority,
                        creationDate: user.creationDate
                    })
                }
            })
        }
        users = usersArray;
    }
    if (req.body.email){
        const usersArray = [];
        let user = await User.find({ email: req.body.email.toLowerCase() })
        if (user && user.length !== 0){
            if (req.user._id.toString() !== user[0]._id.toString()) {
                usersArray.push({
                    _id: user[0]._id,
                    username: user[0].username,
                    email: user[0].email,
                    authority: user[0].authority,
                    creationDate: user[0].creationDate
                })
            }
            users = usersArray
        }else{
            res.status(404).send({ message: "Nothing Found" })
        }
    }
    if (req.body.letter){
        let userOne = await User.find({ username: { $regex: `^${req.body.letter.toLowerCase()}.*$` } })
        let userTwo = await User.find({ username: { $regex: `^${req.body.letter.toUpperCase()}.*$` } })
        const usersArray = [];
        if (userOne.length !== 0){
            userOne.forEach(user => {
                if (req.user._id.toString() !== user._id.toString()) {
                    usersArray.push({
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        authority: user.authority,
                        creationDate: user.creationDate
                    })
                }
            })
        }
        if (userTwo.length !== 0){
            userTwo.forEach(user => {
                if (req.user._id.toString() !== user._id.toString()) {
                    usersArray.push({
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        authority: user.authority,
                        creationDate: user.creationDate
                    })
                }
            })
        }
        users = usersArray;
    }
    if (!users || users.length === 0) return res.status(404).send({ message: "Nothing Found" });
    res.status(200).send(users);
})

/**
 * @swagger
 * /users/{id}:
 *   get:
 *      description: Use to get user informations from id
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: integer
 *            required: true
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: User does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/:id', verify, async(req, res) => {
    const user = await User.findOne({ _id: req.params.id })
    if (!user) return res.status(400).send({ message: "User does not exist" });
    res.status(200).send({
        _id: user._id,
        username: user.username,
        authority: user.authority
    });
})

/**
 * @swagger
 * /users/elevateToAdmin/{id}:
 *   patch:
 *      description: Use to set a user to admin permission level
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: integer
 *            required: true
 *      responses:
 *         '200':
 *           description: Successfully Elevated
 *         '400':
 *           description: Token does not exist or you don't have the authority to make this change | the user you tried to elevate is already admin
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/elevateToAdmin/:id', verify, verifyAdmin, async(req, res) => {
    const user = await User.findOne({ _id: req.user._id })
    if (!user) return res.status(400).send({ message: "The token that you provided does not belong to an existing user" });
    const userToElevate = await User.findOne({ _id: req.params.id });
    if (!userToElevate) return res.status(400).send({ message: "The user you tried to elevate does not exist" });
    if (userToElevate.authority === 10) return res.status(400).send({ message: "The user already has admin authority" });
    userToElevate.authority = 10;
    userToElevate.save();
    res.status(200).send({ message: "Elevated" });
})

/**
 * @swagger
 * /users/demote/{id}:
 *   patch:
 *      description: Use to set a user to admin permission level
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: integer
 *            required: true
 *          - in: body
 *            name: Admin
 *            schema:
 *              type: object
 *              required:
 *                 - ownerPassword
 *              properties:
 *                 ownerPassword:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfully Demoted
 *         '400':
 *           description: Token does not exist or you don't have the authority to make this change | the user you tried to elevate is already admin
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/demote/:id', verify, verifyAdmin, async(req, res) => {
    if (!req.body.ownerPassword) return res.status(401).send("Unauthorized (missing owner password)")
    if (req.body.ownerPassword !== process.env.OWNER_SECRET) return res.status(401).send("Unauthorized (owner password does not correspond)")
    if (req.params.id === process.env.OWNER_ID) return res.status(401).send("Unauthorized, you can't demote the owner !")
    const user = await User.findOne({ _id: req.user._id })
    if (!user) return res.status(400).send({ message: "The token that you provided does not belong to an existing user" });
    const userToDemote = await User.findOne({ _id: req.params.id });
    if (!userToDemote) return res.status(400).send({ message: "The user you tried to demote does not exist" });
    if (userToDemote.authority === 0) return res.status(400).send({message: "The user has no admin authority"});
    userToDemote.authority = 0;
    userToDemote.save();
    res.status(200).send({ message: "Demoted" });
})

/**
 * @swagger
 * /users/:
 *   patch:
 *      description: Use to update your account with your auth-token
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: User
 *            schema:
 *              type: object
 *              required:
 *                 - username
 *                 - email
 *                 - password
 *              properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfully Updated
 *         '400':
 *           description: User to update does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/', verify, async(req, res) => {
    const userToUpdate = await User.findOne({ _id: mongoose.Types.ObjectId(req.user._id) })
    if (!userToUpdate) return res.status(400).send({ message: "User to update does not exist" })
        // Check body parameters existence
    if (!req.body.username) { req.body.username = userToUpdate.username }
    if (!req.body.email) { req.body.email = userToUpdate.email }
    if (!req.body.password) {
        req.body.password = userToUpdate.password
    } else {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
    }


    // Data Validation
    const { error } = userUpdateValidation(req.body);
    if (error) return res.status(400).send({ Error: error.details[0].message });

    if (req.body.email && req.body.email !== userToUpdate.email){
        const checkEmailExistence = await User.findOne({email: req.body.email});
        if (checkEmailExistence) return res.status(401).send("This email already exist");
    }
    const updated = await userToUpdate.updateOne({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    if (!userToUpdate) return res.status(400).send({ message: "This user does not exist or has been deleted !" })
    const userUpdated = await User.findOne({ _id: req.user._id })
    res.status(200).send({ message: "User Updated", updatedUser: userUpdated });
})



//TODO [Patch] Add a method "setProfilePicture(base64IMG)" to change profile picture and save it as a base64 image

// TODO [PATCH] Add a method "buyCredits([userID], amount)" to buy credits to the logged user or for a given user ID

// TODO [PATCH][OWNER ONLY] Add a method "giveCredits([userID], amount)" to give credits to the logged user  or for a given user ID

// TODO [PATCH] Add a method "transferCredits([userIDToSend], userIDToReceive, amount)" to transfer credits from the logged user [OWNER ONLY](or from an user) to another given user ID

// TODO [PATCH] Add a method "updateInvite(productID, CustomType.ACCEPT/CustomType.REFUSE)" to accept to join a group or to refuse joining the group



/**
 * @swagger
 * /users/:
 *   delete:
 *      description: Use to delete your account
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      responses:
 *         '200':
     *       description: Successfully Deleted
 *         '400':
 *           description: Token does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.delete('/', verify, async(req, res) => {
    const user = await User.findOne({ _id: mongoose.Types.ObjectId(req.user._id) })
    if (!user) return res.status(400).send({ message: "The Token you used does not belong to an user" });
    user.delete();
    res.status(200).send({ message: "Deleted User!" })
})

/**
 * @swagger
 * /users/{id}/{adminSecretPassword}:
 *   delete:
 *      description: Use to delete an account (leave empty the body if you don't want to delete an admin account / or you are not the owner)
 *      tags:
 *          - User
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *          - in: path
 *            name: adminSecretPassword
 *            schema:
 *              type: string
 *            required: true
 *      responses:
 *         '200':
 *           description: Successfully Deleted
 *         '400':
 *           description: User does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.delete('/:id/:adminSecretPassword', verify, verifyAdmin, async(req, res) => {
    let user;
    try {
        user = await User.findOne({ _id: mongoose.Types.ObjectId(req.params.id)})
    }catch (e) {
        res.status(500).send(e.message)
    }

    if (!user) return res.status(400).send({ message: "The user does not exist" });
    if (parseInt(user.authority.level) === 10){
        if (!req.params.adminSecretPassword) return res.status(403).send("You can't delete an admin account without the owner secret pass")
        if (req.params.adminSecretPassword !== process.env.OWNER_SECRET) return res.status(403).send("Wrong owner secret pass")
        const Keys = await Key.find({creatorID: req.params.id})
        const Products = await Product.find( {ownerID: req.params.id} )
        Keys.forEach(key => key.delete())
        Products.forEach(product => product.delete())
        user.delete();
        res.status(200).send({ message: "Deleted User!" })
    }else{
        user.delete();
        res.status(200).send({ message: "Deleted User!" })
    }

})

module.exports = router;