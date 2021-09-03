const mongoose = require('mongoose');
require('dotenv').config();



const KeySchema = new mongoose.Schema({
    productID: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    creatorID: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    creationDate: {
        type: Date,
        default: (Date.now()),
        required: true
    },
    expirationDate: {
        type: Date,
        default: (Date.now() + 86400000 * 7),
        required: true
    },
    UUID: {
        type: String,
        required: true
    },
    HWID : {
        lockStatus: {
            type: Boolean,
            default: false
        },
        HWIDInfo: {
            type: String,
            default: null
        }
    },
    used: {
        type: Boolean,
        default: false
    },
    expired: {
        type: Boolean,
        default: false
    }
});



module.exports = mongoose.model('Key', KeySchema)