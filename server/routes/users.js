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

    if (!updated) return res.status(500).send("An error occured while updating error, please contact the owner!")
    if (!userToUpdate) return res.status(400).send({ message: "This user does not exist or has been deleted !" })
    const userUpdated = await User.findOne({ _id: req.user._id })
    res.status(200).send({ message: "User Updated", updatedUser: userUpdated });
})

/**
 * @swagger
 * /users/profilePicture:
 *   patch:
 *      description: Use to update your account profile picture using your token (only BASE64IMG)
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
 *                 - image
 *              properties:
 *                 image:
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
router.patch('/profilePicture', verify, async(req, res) => {
    const userToUpdate = await User.findOne({ _id: mongoose.Types.ObjectId(req.user._id) })
    if (!userToUpdate) return res.status(400).send({ message: "User to update does not exist" })

    if (!req.body.image) return res.status(400).send("No update, since no base64 image was provided!");
    if (req.body.image === userToUpdate.profilePicture) return res.status(400).send("The image you tried to upload is the same that you already have.");
    const updated = await userToUpdate.updateOne({
        profilePicture: req.body.image,
    });
    if (!updated) return res.status(500).send("An error occured during the user update (contact the owner)")
    if (!userToUpdate) return res.status(400).send({ message: "This user does not exist or has been deleted !" })
    const userUpdated = await User.findOne({ _id: req.user._id })
    res.status(200).send({ message: "User Updated", updatedUser: userUpdated });
})

/**
 * @swagger
 * /users/buyCredits:
 *   patch:
 *      description: Use to buy credits for the logged in user or for a given userID
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
 *                 - userID
 *                 - amount
 *              properties:
 *                 userID:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                   default: 500
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
router.patch('/buyCredits', verify, async(req, res) => {
    let id, oldCredit;
    if (req.body.userID === '' || req.body.userID === null || req.body.userID === undefined || req.body.userID === "userID"){
        id = req.user._id;
    }else{
        id = req.body.userID;
    }
    const userToUpdate = await User.findOne({ _id: mongoose.Types.ObjectId(id) })
    if (!userToUpdate) return res.status(400).send({ message: "User to update does not exist" })
    if (req.body.amount <= 0) return res.status(400).send("You can't buy 0 or less than 0 credit!");
    oldCredit = userToUpdate.credits;
    const updated = await userToUpdate.updateOne({
        credits: userToUpdate.credits + req.body.amount,
    });
    if (!updated) return res.status(500).send("An error occured during the user update (contact the owner)")
    if (!userToUpdate) return res.status(400).send({ message: "This user does not exist or has been deleted !" })
    const userUpdated = await User.findOne({ _id: id })
    res.status(200).send({ message: "Credits bought successfully", oldCredit: oldCredit, newCredit: userUpdated.credits });
})

/**
 * @swagger
 * /users/giveCredits:
 *   patch:
 *      description: Use to give credits for the logged in user or for a given userID [OWNER ONLY]
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
 *                 - userID
 *                 - amount
 *                 - ownerSecret
 *              properties:
 *                 userID:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                   default: 500
 *                 ownerSecret:
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
router.patch('/giveCredits', verify, verifyAdmin, async(req, res) => {
    if (req.body.ownerSecret !== process.env.OWNER_SECRET) return res.status(401).send("You need the owner secret pass to give credits!")
    let id, oldCredit;
    if (req.body.userID === '' || req.body.userID === null || req.body.userID === undefined || req.body.userID === "userID"){
        id = req.user._id;
    }else{
        id = req.body.userID;
    }
    const userToUpdate = await User.findOne({ _id: mongoose.Types.ObjectId(id) })
    if (!userToUpdate) return res.status(400).send({ message: "User to update does not exist" })
    if (req.body.amount <= 0) return res.status(400).send("You can't give 0 or less than 0 credit!");
    oldCredit = userToUpdate.credits;
    const updated = await userToUpdate.updateOne({
        credits: userToUpdate.credits + req.body.amount,
    });
    if (!updated) return res.status(500).send("An error occured during the user update (contact the owner)")
    if (!userToUpdate) return res.status(400).send("This user does not exist or has been deleted !")
    const userUpdated = await User.findOne({ _id: id })
    res.status(200).send({ message: "Credits given successfully", oldCredit: oldCredit, newCredit: userUpdated.credits });
})

/**
 * @swagger
 * /users/transferCredits:
 *   patch:
 *      description: Use to transfer your credits (do not pass userID to to it) to someone else [OWNER ONLY] or to transfer credit between two users
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
 *                 - giverUserID
 *                 - receiverUserID
 *                 - amount
 *                 - ownerSecret
 *              properties:
 *                 userID:
 *                   type: string
 *                 receiverUserID:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                   default: 500
 *                 ownerSecret:
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
router.patch('/transferCredits', verify, async(req, res) => {
    if(!req.body.receiverUserID) return res.status(400).send("No receiver userID provided!");
    if (req.body.amount <= 0) return res.status(400).send("You can't give 0 or less than 0 credit!");
    let ownerMod = false;
    let id;
    if (req.body.userID === '' || req.body.userID === null || req.body.userID === undefined || req.body.userID === "userID"){
        id = req.user._id;
    }else{
        ownerMod = true;
        id = req.body.userID;
    }
    if (id === req.body.receiverUserID) return res.status(400).send("You can't transfer credits from self!");

    const giver = await User.findOne({ _id: mongoose.Types.ObjectId(id)});
    if (!giver) return res.status(400).send("The user you are trying to take the credits from do not exist!");
    const receiver = await User.findOne({ _id: mongoose.Types.ObjectId(req.body.receiverUserID)});
    if (!receiver) return res.status(400).send("The user you are trying to transfer credits to, do not exist!");
    if (giver.credits < req.body.amount) return res.status(400).send("Can't transfer more credits than what the user possess");
    let giverOldCredit, receiverOldCredit;
    giverOldCredit = giver.credits;
    receiverOldCredit = receiver.credits;
    if (ownerMod){
        if (req.body.ownerSecret !== process.env.OWNER_SECRET) return res.status(401).send("You need the owner secret pass to transfer credits between users!");
        const updateTake = await giver.updateOne({
            credits: giver.credits - req.body.amount
        })
        if(!updateTake) return res.status(500).send("There was an error while taking the credits from the user!");
        const updateGive = await receiver.updateOne({
            credits: receiver.credits + req.body.amount
        })
        if(!updateGive) return res.status(500).send("There was an error while giving the credits to the user!");
        const giverUpdated = await User.findOne({ _id: mongoose.Types.ObjectId(id)});
        const receiverUpdated = await User.findOne({ _id: mongoose.Types.ObjectId(req.body.receiverUserID)});
        res.status(200).send({message: "Transfer Successfull !", giverOldCredit: giverOldCredit, receiverOldCredit: receiverOldCredit, giverNewCredit: giverUpdated.credits, receiverNewCredit: receiverUpdated.credits })
    }else{
        const updateTake = await giver.updateOne({
            credits: giver.credits - req.body.amount
        })
        if(!updateTake) return res.status(500).send("There was an error while taking the credits from the user!");
        const updateGive = await receiver.updateOne({
            credits: receiver.credits + req.body.amount
        })
        if(!updateGive) return res.status(500).send("There was an error while giving the credits to the user!");
        const giverUpdated = await User.findOne({ _id: mongoose.Types.ObjectId(id)});
        const receiverUpdated = await User.findOne({ _id: mongoose.Types.ObjectId(req.body.receiverUserID)});
        res.status(200).send({message: "Transfer Successfull !", giverOldCredit: giverOldCredit, receiverOldCredit: receiverOldCredit, giverNewCredit: giverUpdated.credits, receiverNewCredit: receiverUpdated.credits })
    }





    // res.status(200).send({ message: "Credits given successfully", oldCredit: oldCredit, newCredit: userUpdated.credits });
})


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