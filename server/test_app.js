const { createUserTest } = require("./utils/test_functions/User");
const { createProductTest } = require("./utils/test_functions/Product");
const {createKeyTest} = require("./utils/test_functions/Key");
const db = require('./utils/mongoose');



//db.init();

// Creation Without any constraint (only use for dev or it could cause some problem with your database)
/*
setTimeout(() => {
    // User creation Test
    createUserTest(10, 500, "smlartaudalexandre@gmail.com", "passwordTest", "Nardine");
    // Product creation Test
    createProductTest("6132378d0c39e60edcb20a07", "Test Product")
    // Key creation Test (with HWID Lock)
    createKeyTest("61323b834afd532a9ceb98b0", "6132378d0c39e60edcb20a07", "zefzefzefzefzef", true, "This is the HWID LOCK INFOS");
    // Key creation Test (without HWID Lock)
    createKeyTest("61323b834afd532a9ceb98b0", "6132378d0c39e60edcb20a07", "zefzefzefzefzef", false);
}, 5000)
*/
