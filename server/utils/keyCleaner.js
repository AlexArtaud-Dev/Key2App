const mongoose = require('mongoose');
const { Key, Product, KeyToken } = require("../models/models")


module.exports = function(timeInMS) {
    setInterval(async () => {

        const keys = await Key.find();
        if(keys){
            for(let key of keys){
                if (key){
                    if (key.expired){
                        const productToUpdate = await Product.findOne({_id: key.productID});
                        const keyTokenToUpdate = await KeyToken.findOne({keyID: key._id});
                        if (productToUpdate){
                            productToUpdate.keys.pull(key._id);
                            await productToUpdate.save();
                        }
                        if (keyTokenToUpdate){
                            await keyTokenToUpdate.delete();
                        }
                        await key.delete();
                    }
                }
            }
        }
    }, timeInMS)
}