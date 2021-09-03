const Mongoose = require("mongoose");
const {Product} = require("../../models/models");

function createProductTest(ownerID, name) {
    const newProduct = new Product({
        ownerID: Mongoose.Types.ObjectId(ownerID),
        name: name
    })
    newProduct.save()
        .then(r => console.log("Created :" + r))
        .catch(err => console.log(err))
}

module.exports = {
    createProductTest
}