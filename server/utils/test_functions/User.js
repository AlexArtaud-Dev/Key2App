const {User} = require("../../models/models");

function createUserTest(authority, credits, email, password, username) {
    const newUser = new User({
        authority: authority,
        credits: credits,
        email: email,
        password : password,
        username: username
    })
    newUser.save()
        .then(r => console.log("Created :" + r))
        .catch(err => console.log(err))
}

module.exports = {
    createUserTest
}