const mongoose = require('mongoose');
require('dotenv').config();



const KeyTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    keyID:{
        type: mongoose.Types.ObjectId,
        required: true
    }
});



module.exports = mongoose.model('KeyToken', KeyTokenSchema)