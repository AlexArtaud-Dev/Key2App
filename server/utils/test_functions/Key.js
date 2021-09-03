const Mongoose = require("mongoose");
const {Key} = require("../../models/models");

function createKeyTest(productID, creatorID, UUID, lockStatus, HWIDInfo) {
    let newKey
    if (lockStatus){
        newKey = new Key({
            productID: Mongoose.Types.ObjectId(productID),
            creatorID: Mongoose.Types.ObjectId(creatorID),
            UUID: UUID,
            HWID: {
                lockStatus: lockStatus,
                HWIDInfo: HWIDInfo
            }
        })
    }else{
        newKey = new Key({
            productID: Mongoose.Types.ObjectId(productID),
            creatorID: Mongoose.Types.ObjectId(creatorID),
            UUID: UUID
        })
    }

    newKey.save()
        .then(r => console.log("Created :" + r))
        .catch(err => console.log(err))
}

module.exports = {
    createKeyTest
}