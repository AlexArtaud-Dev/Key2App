const router = require('express').Router();
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const verify = require('./middlewares/verifyToken');
const verifyAdmin = require('./middlewares/verifyAdminToken');
const { User, Key, Product } = require("../models/models");

// TODO [GET] Add a method "getProduct(productID)" to get all the informations about a product

// TODO [POST] Add a method "createProduct(name)" to create a product with a custom name (ownerID taken from the token auth)

// TODO [PATCH] Add a method "changeName(productID, oldName, newName)" to change the current product name

// TODO [PATCH] Add a method "changeDescription(productID, newDesc)" to change the current product description

// TODO [PATCH] Add a method "transferProduct(productID, newOwnerID)" to transfer a product that the logged user own to another user (need to clear all the key that the owner generated)

// TODO [PATCH] Add a method "inviteUser(productID, userID)" to invite an user to the product

// TODO [DELETE] Add a method "deleteKey(productID, keyID)" to delete a key from a product (also delete from key db)

// TODO [DELETE] Add a method "clearKeys(productID)" to clear all the key from the product (Optional : add a system so that unused key are refunded, need to set a key price)(also delete from key db)

// TODO [DELETE] Add a method "deleteProduct(productID)" to delete a product with all the linked keys




module.exports = router;