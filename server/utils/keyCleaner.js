const mongoose = require('mongoose');
const { Key } = require("../models/models")


module.exports = function(timeInMS) {
    setInterval(async () => {

        const keys = await Key.find();
        if(keys){
            for(let key of keys){
                if (key){
                    if (key.expired){
                        await key.delete();
                    }
                }
            }
        }
    }, timeInMS)
}