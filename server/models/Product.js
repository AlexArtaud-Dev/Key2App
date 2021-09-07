const mongoose = require('mongoose');
require('dotenv').config();



const ProductSchema = new mongoose.Schema({
    ownerID: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        min: 3,
        max: 256
    },
    description: {
        type: String,
        default: "This is a basic description that you can customize",
        required: false,
        min: 10
    },
    creationDate: {
        type: Date,
        default: (Date.now())
    },
    members: {
        type: Array,
        required: true,
        default: []
    },
    keys: {
        type: Array,
        required: true,
        default: []
    }
});



module.exports = mongoose.model('Product', ProductSchema)