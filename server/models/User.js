const { required } = require('joi');
const { profilePlaceholder } = require("../assets/placeholders/base64Images")
const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    creationDate: {
        type: Date,
        default: (Date.now())
    },
    authority: {
        type: Number,
        required: true,
        default: 0
    },
    ownedProducts: {
        type: Array,
        default: []
    },
    isPartOfProducts: {
        type: Array,
        default: []
    },
    credits: {
        type: Number,
        required: true,
        default: 0
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
        max: 255,
        min: 6
    },
    profilePicture: {
        type: String,
        default: profilePlaceholder,
    },
    pendingInvites: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model('User', userSchema)