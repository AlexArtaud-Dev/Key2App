const readline = require('readline');
const {User} = require("./models/models");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const fs = require('fs')
const randtoken = require('rand-token');
const ts = new Date();
let mongoDBLink;
let token;
let username, email, password, ownerID;

console.clear();
console.log("―――――――――――――――――――――――――――――――――")
console.log("Welcome to Key2App setup Script")
console.log("―――――――――――――――――――――――――――――――――")

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

setTimeout(async () => {
    console.clear();
    console.log("Let's start by adding your mongoDB cluster connection link !\n")
    console.log("It should looks like this : \"mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority\" ")
    console.log("If you need help to get it, go here : \"https://www.mongodb.com/blog/post/quick-start-nodejs-mongodb--how-to-get-connected-to-your-database\"\n ")

    await rl.question('So what\'s your mongoDB link ? (paste it the console) ', async (answer) => {
        console.log(`So your link is : \"${answer}\" `)
        mongoDBLink = answer;
        await rl.close();
        const r2 = await readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        r2.question("To continue, press enter !" , () => {
            if(mongoDBLink){
                console.clear();
                console.log("Let's try to connect to mongoDB !");
                setTimeout(() => {
                    console.clear();
                    console.log("Connecting ....");
                    const mongOptions = {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        useCreateIndex: true,
                        useFindAndModify: false,
                        autoIndex: false, // Don't build indexes
                        poolSize: 10, // Maintain up to 10 socket connections
                        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                        family: 4 // Use IPv4, skip trying IPv6
                    }
                    mongoose.connect(mongoDBLink, mongOptions);
                    mongoose.Promise = global.Promise;
                    mongoose.connection.on("connected", () => {
                        console.log(ts.toLocaleString() + " - Connected to Mongo Cluster (" + mongoose.connection.host + ")");
                    });
                    r2.close();
                    setTimeout(async () => {
                        console.clear();
                        console.log("Generating your secret token ...")
                        token = await randtoken.generate(128);
                        console.log("Your secret token is : " + token);
                        const r3 = await readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });
                        r3.question("To continue, press enter !" , () => {
                            console.clear();
                            console.log("Now we are going to generate your super admin account!")
                            setTimeout(async () => {
                                r3.close();
                                console.clear()
                                const r4 = await readline.createInterface({
                                    input: process.stdin,
                                    output: process.stdout
                                });
                                r4.question("Type your super admin username (min 6 char) !" , (answer) => {
                                    if (answer.length < 6){
                                        console.clear();
                                        console.log("You did not follow the instruction, restart the setup script!");
                                        process.exit(0);
                                    }else{
                                        console.clear();
                                        username = answer;
                                        console.log("Your super admin username is now : " + username);
                                        setTimeout(async () => {
                                            console.clear();
                                            r4.close();
                                            const r5 = await readline.createInterface({
                                                input: process.stdin,
                                                output: process.stdout
                                            });
                                            r5.question("Type your super admin email !" , (answer) => {
                                                if (!answer.includes("@")){
                                                    console.clear();
                                                    console.log("You provided an email without @, restart the setup script!");
                                                    process.exit(0);
                                                }else {
                                                    console.clear();
                                                    email = answer;
                                                    console.log("Your super admin email is now : " + email);
                                                    setTimeout(async () => {
                                                        r5.close();
                                                        console.clear()
                                                        const r6 = await readline.createInterface({
                                                            input: process.stdin,
                                                            output: process.stdout
                                                        });
                                                        r6.question("Type your super admin password (no confirmation, so be sure to type it well | 1 upper char, 1 lower char, 1 digit, 1 special char, 8 char min) !" , (answer) => {
                                                            const passwordStrength = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})");
                                                            if (!passwordStrength.test(answer)){
                                                                console.clear();
                                                                console.log("You provided a password not strong enough, restart the setup script!");
                                                                process.exit(0);
                                                            }else{
                                                                console.clear();
                                                                password = answer;
                                                                console.log("Your super admin password is now : " + password);
                                                                setTimeout(async () => {
                                                                    console.clear();
                                                                    console.log("Creating your account in the database");
                                                                    const salt = await bcrypt.genSalt(10);
                                                                    const hashPassword = await bcrypt.hash(password, salt);
                                                                    const newUser = new User({
                                                                        authority: 10,
                                                                        credits: 100000000,
                                                                        email: email,
                                                                        password: hashPassword,
                                                                        username: username
                                                                    })

                                                                    await newUser.save()
                                                                        .then(r => console.log("Super Admin Account successfully created"))
                                                                        .catch(err => console.log(err))
                                                                    let userOwner = await User.findOne({email: email, password: hashPassword, username: username});
                                                                    ownerID = userOwner._id;
                                                                    setTimeout(async () => {
                                                                        r6.close();
                                                                        console.clear();
                                                                        const path = './.env'
                                                                        try {
                                                                            if (fs.existsSync(path)) {
                                                                                const r7 = await readline.createInterface({
                                                                                    input: process.stdin,
                                                                                    output: process.stdout
                                                                                });
                                                                                r7.question("You already successfully setup the project before. Do you want to erase the previous installation ? (Y/N)" , (answer) => {
                                                                                   if (answer.toLowerCase().includes("y")) {
                                                                                        console.clear()
                                                                                       fs.writeFile("./.env", `DB_CONNECTION = ${mongoDBLink}\nTOKEN_SECRET = ${token}\nOWNER_ID = ${ownerID}`, function(err) {
                                                                                               if(err) {
                                                                                                   return console.log(err);
                                                                                               }
                                                                                               console.log("Setup finished, shutting down !");
                                                                                               process.exit(0);
                                                                                           });
                                                                                   }else{
                                                                                       console.clear();
                                                                                       console.log("Shutting down setup program!");
                                                                                       process.exit(0);
                                                                                   }
                                                                                })
                                                                            }else{
                                                                                console.clear()
                                                                                const ownerSecret = await randtoken.generate(128);
                                                                                fs.writeFile("./.env", `DB_CONNECTION = ${mongoDBLink}\nTOKEN_SECRET = ${token}\nOWNER_SECRET = ${ownerSecret}`, function(err) {
                                                                                        if(err) {
                                                                                            return console.log(err);
                                                                                        }
                                                                                        console.log("Setup finished, shutting down !");
                                                                                        process.exit(0);
                                                                                    });
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err)
                                                                        }
                                                                    }, 5000);
                                                                }, 5000);
                                                            }
                                                        })
                                                    }, 5000);
                                                }
                                            })
                                        }, 5000);
                                    }
                                })
                            },5000)
                        })
                    }, 5000)
                }, 1500)
            }else{
                r2.close();
                console.clear();
                console.log("You did not give your mongoDB link, program shutting down!");
                process.exit(0)
            }
        })
    })







}, 2000)


