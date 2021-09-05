require('dotenv').config();
const { User } = require("../../models/models")

module.exports = async function(req, res, next) {
    const user = await User.findOne({_id: req.user._id});
    if (!user) return res.status(400).send({message: "Acces Denied"})

    if (user.authority !== 10) return res.status(401).send("Unauthorized");
    next();
}