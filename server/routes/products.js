const router = require('express').Router();
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const verify = require('./middlewares/verifyToken');
const verifyAdmin = require('./middlewares/verifyAdminToken');
const { User, Key, Product } = require("../models/models");
const uuidKey = require("uuid-apikey");


/**
 * @swagger
 * /products/{productID}:
 *   get:
 *      description: Use to get informations about a product
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: path
 *            name: productID
 *            schema:
 *              type: integer
 *            required: true
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: Product does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.get('/:productID', verify, async(req, res) => {
    if(!req.params.productID) return res.status(400).send("You did not provide any product ID!")
    const product = await Product.findOne({_id: mongoose.Types.ObjectId(req.params.productID)});
    if (!product) return res.status(400).send("This product does not exist or was deleted!");
    res.status(200).send(product);
})

/**
 * @swagger
 * /products/create:
 *   post:
 *      description: Use to search for user with letter or name or email
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - name
 *              properties:
 *                 name:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: An error occurred
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/create', verify, async(req, res) => {
    if(!req.body.name)return res.status(400).send("No product name provided!");
    const user = await User.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
    if (!user) res.status(400).send("The user that tried to create the product do not exist!");
    const newProduct = new Product({
        ownerID: req.user._id,
        name: req.body.name
    })
    await newProduct.save();
    const checkProduct = await Product.findOne({ownerID: req.user._id, name: req.body.name});
    if (!checkProduct) return res.status(500).send("An error occurred while creating your product, if it happens again, contact the administrator!");
    user.ownedProducts.push(mongoose.Types.ObjectId(checkProduct._id));
    const updateUser = await user.save();
    if (!updateUser) return res.status(500).send("An error occurred while adding the product to the user owned product list, if it happens again, contact the administrator!");
    res.status(200).send({message: "Product Creation Successfull", product: checkProduct});
})

/**
 * @swagger
 * /products/changeName:
 *   patch:
 *      description: Use to change a product name
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *                 - oldName
 *                 - newName
 *              properties:
 *                 productID:
 *                   type: string
 *                 oldName:
 *                   type: string
 *                 newName:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/changeName', verify, async(req, res) => {
    if(!req.body.productID) return res.status(400).send("No product ID provided!");
    if(!req.body.oldName) return res.status(400).send("You did not provide the old name of the product!");
    if(!req.body.newName) return res.status(400).send("You did not provide the new name of the product, so no change will occur!");

    const product = await Product.findOne({_id: mongoose.Types.ObjectId(req.body.productID)});
    if(!product) return res.status(400).send("This product does not exist or was deleted!");
    if (product.ownerID.toString() !== req.user._id) return res.status(401).send("You can't change the name of a product you do not own!")
    if (product.name !== req.body.oldName) return res.status(400).send("The old name you provided do not match the current name of the product!");
    if (product.name === req.body.newName) return res.status(400).send("You tried to set the new name of the product to the old one. No change occurred!");
    if (req.body.newName.length < 3) return res.status(400).send("The new name you tried to give was under 3 character, you need at least 3 characters!")
    const updatedProduct = await product.updateOne({
        name: req.body.newName
    })
    if (!updatedProduct) return res.status(500).send("An error occurred while updating the product, if it persist, contact the administrator!");
    const newProduct = await Product.findOne({_id : mongoose.Types.ObjectId(req.body.productID)});
    res.status(200).send({message: "Product Name Updated", newProduct: newProduct});
})

/**
 * @swagger
 * /products/changeDesc:
 *   patch:
 *      description: Use to change a product description
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *                 - newDesc
 *              properties:
 *                 productID:
 *                   type: string
 *                 newDesc:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/changeDesc', verify, async(req, res) => {
    if(!req.body.productID) return res.status(400).send("No product ID provided!");
    if(!req.body.newDesc) return res.status(400).send("You did not provide the new description of the product, so no change will occur!");

    const product = await Product.findOne({_id: mongoose.Types.ObjectId(req.body.productID)});
    if(!product) return res.status(400).send("This product does not exist or was deleted!");
    if (product.ownerID.toString() !== req.user._id) return res.status(401).send("You can't change the description of a product you do not own!")
    if (product.description === req.body.newDesc) return res.status(400).send("You tried to set the new description of the product to the old one. No change occurred!");
    if (req.body.newDesc.length < 10) return res.status(400).send("The new description you tried to give was under 10 character, you need at least 10 characters!")
    const updatedProduct = await product.updateOne({
        description: req.body.newDesc
    })
    if (!updatedProduct) return res.status(500).send("An error occurred while updating the product, if it persist, contact the administrator!");
    const newProduct = await Product.findOne({_id : mongoose.Types.ObjectId(req.body.productID)});
    res.status(200).send({message: "Product Description Updated", newProduct: newProduct});
})

/**
 * @swagger
 * /products/invite:
 *   patch:
 *      description: Use to invite an user to a product
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *                 - userID
 *              properties:
 *                 productID:
 *                   type: string
 *                 userID:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted / The user does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/invite', verify, async(req, res) => {
    if(!req.body.productID) return res.status(400).send("No product ID provided!");
    if(!req.body.userID) return res.status(400).send("You did not provide the userID to invite!");

    const product = await Product.findOne({_id: mongoose.Types.ObjectId(req.body.productID)});
    if(!product) return res.status(400).send("This product does not exist or was deleted!");
    if (product.ownerID.toString() !== req.user._id) return res.status(401).send("You can't invite an user to a product you do not own!")
    if (product.members.includes(req.body.userID)) return res.status(400).send("The user is already part of the product!")

    product.members.push(mongoose.Types.ObjectId(req.body.userID));
    const update = await product.save()
    if (!update) return res.status(500).send("An error occurred while updating the product member list, if it persist, contact the administrator!");

    const user = await User.findOne({_id: mongoose.Types.ObjectId(req.body.userID)});
    user.pendingInvites.push(mongoose.Types.ObjectId(product._id));
    const updateUser = await user.save();
    if (!updateUser) return res.status(500).send("An error occurred while updating the user pending invite list, if it persist, contact the administrator!");

    res.status(200).send("User added to the product member list");
})

/**
 * @swagger
 * /products/remove:
 *   patch:
 *      description: Use to remove an user from a product
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *                 - userID
 *              properties:
 *                 productID:
 *                   type: string
 *                 userID:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted / The user does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.patch('/remove', verify, async(req, res) => {
    if(!req.body.productID) return res.status(400).send("No product ID provided!");
    if(!req.body.userID) return res.status(400).send("You did not provide the userID to invite!");

    const product = await Product.findOne({_id: mongoose.Types.ObjectId(req.body.productID)});
    if(!product) return res.status(400).send("This product does not exist or was deleted!");
    if (product.ownerID.toString() !== req.user._id) return res.status(401).send("You can't remove an user from a product you do not own!")
    if (!product.members.includes(req.body.userID)) return res.status(400).send("The user is already not a part of the product!")

    product.members.pull(mongoose.Types.ObjectId(req.body.userID));
    const update = await product.save()
    if (!update) return res.status(500).send("An error occurred while updating the product member list, if it persist, contact the administrator!");

    const user = await User.findOne({_id: mongoose.Types.ObjectId(req.body.userID)});
    if (user.pendingInvites.includes(mongoose.Types.ObjectId(product._id))){
        user.pendingInvites.pull(mongoose.Types.ObjectId(product._id));
        const updateUser = await user.save();
        if (!updateUser) return res.status(500).send("An error occurred while updating the user pending invite list, if it persist, contact the administrator!");
    }


    res.status(200).send("User removed from the product member list");
})

/**
 * @swagger
 * /products/createKey:
 *   post:
 *      description: Use to create a product key (don't add a userID to create for your own and add a userID to create for someone else [ADMIN ONLY])
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *                 - userID
 *                 - days
 *              properties:
 *                 productID:
 *                   type: string
 *                 userID:
 *                   type: string
 *                 days:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted / The user does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.post('/createKey', verify, async(req, res) => {
    if (!req.body.productID) return res.status(400).send("No product ID provided!");
    if (req.body.days && isNaN(req.body.days)) return res.status(400).send("The days you provided are not an integer (eq : 1-2-3) !");
    let userID;
    const productToUpdate = await Product.findOne({_id: req.body.productID});
    if (!productToUpdate) return res.status(400).send("The product does not exist or was deleted!")
    const requester = await User.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
    if (req.body.userID && requester){
        if(requester.authority === 10){
            userID = req.body.userID;
        }else{
            return res.status(401).send("You cannot create a key for someone else if you are not administrator!")
        }
    }else{
        userID = req.user._id;
    }
    const owner = await User.findOne({_id: mongoose.Types.ObjectId(userID)});
    if(!owner) return res.status(400).send("The userID you used do not exist or was deleted!");
    if (productToUpdate.ownerID.toString() !== req.user._id) return res.status(401).send("You can't create a key of a product you do not own!");
    const key = uuidKey.create();
    let newKey;
    if (req.body.days){
        newKey = new Key({
            productID: mongoose.Types.ObjectId(req.body.productID),
            creatorID: mongoose.Types.ObjectId(userID),
            expirationDate: (Date.now() + 86400000 * req.body.days),
            UUID: key.uuid
        })
    }else{
        newKey = new Key({
            productID: mongoose.Types.ObjectId(req.body.productID),
            creatorID: mongoose.Types.ObjectId(userID),
            UUID: key.uuid
        })
    }
    if (!owner.isPartOfProducts.includes(mongoose.Types.ObjectId(req.body.productID)) && !owner.ownedProducts.includes(mongoose.Types.ObjectId(req.body.productID))) return res.status(401).send("You cannot create a key for someone that is not part of the product");
    const savedStatus = await newKey.save();
    if (!savedStatus) return res.status(500).send("Internal Server Error : An error happened when creating the key, contact the owner!");
    productToUpdate.keys.push(mongoose.Types.ObjectId(savedStatus._id));
    const productSavedStatus = await productToUpdate.save();
    if (!productSavedStatus) {
        await Key.deleteOne({_id: savedStatus._id});
        return res.status(500).send("Internal Server Error : An error happened when adding the key to the product, contact the owner")
    }

    if (req.body.userID && requester){
        if (requester.credits < 10) return res.status(400).send("You can't buy a key if you don't have enough credit!");
        requester.credits = requester.credits - 10;
        const savedRequester = await requester.save();
        if (!savedRequester) {
            await Key.deleteOne({_id: savedStatus._id});
            return res.status(500).send("Internal Server Error : An error happened when using the user credits, contact the owner");
        }
    }else{
        if (owner.credits < 10) return res.status(400).send("You can't buy a key if you don't have enough credit!");
        owner.credits = owner.credits - 10;
        const savedOwner = await owner.save();
        if (!savedOwner) {
            await Key.deleteOne({_id: savedStatus._id});
            return res.status(500).send("Internal Server Error : An error happened when using the user credits, contact the owner");
        }
    }

    res.status(200).send("Key successfully created!");
})

/**
 * @swagger
 * /products/clearKeys:
 *   delete:
 *      description: Use to clear all the keys from a product
 *      tags:
 *          - Product
 *      security:
 *          - Bearer: []
 *      parameters:
 *          - in: body
 *            name: Product
 *            schema:
 *              type: object
 *              required:
 *                 - productID
 *              properties:
 *                 productID:
 *                   type: string
 *      responses:
 *         '200':
 *           description: Successfull Request
 *         '400':
 *           description: The product does not exist or was deleted / The user does not exist
 *         '401':
 *           description: Unauthorized
 *         '500':
 *           description: Internal servor error
 */
router.delete('/clearKeys', verify, async(req, res) => {
    if (!req.body.productID) return res.status(400).send("No product ID provided");
    const product = await Product.findOne({ _id: mongoose.Types.ObjectId(req.body.productID)});
    if (!product) return res.status(400).send("The product does not exist or was deleted!");
    const requester = await User.findOne({_id: req.user._id});
    if (!requester) return res.status(400).send("The user that tried to clear keys does not exist or was deleted!");
    if (product.ownerID.toString() === req.user._id || requester.authority === 10){
        await Promise.all(product.keys.map(async (key) => {
            const keyToDelete = await Key.findOne({_id: key})
            const owner = await User.findOne({_id: keyToDelete.creatorID});
            if (keyToDelete && owner){
                if (keyToDelete.used === true){
                    owner.credits = owner.credits + 10;
                    await owner.save();
                    product.keys.pull(mongoose.Types.ObjectId(keyToDelete._id));
                    await keyToDelete.delete();
                }else{
                    product.keys.pull(mongoose.Types.ObjectId(keyToDelete._id));
                    await keyToDelete.delete();
                }
            }
        }))
    }else{
        return res.status(401).send("You are not the owner or you don't have administrator permissions to clear thoses product keys!");
    }
    await product.save();
    res.status(200).send("Keys successfully cleared from product!");
})

// TODO [PATCH] Add a method "transferProduct(productID, newOwnerID)" to transfer a product that the logged user own to another user (need to clear all the key that the owner generated)

// TODO [DELETE] Add a method "deleteKey(productID, keyID)" to delete a key from a product (also delete from key db)

// TODO [DELETE] Add a method "clearKeys(productID)" to clear all the key from the product (Optional : add a system so that unused key are refunded, need to set a key price)(also delete from key db)

// TODO [DELETE] Add a method "deleteProduct(productID)" to delete a product with all the linked keys




module.exports = router;