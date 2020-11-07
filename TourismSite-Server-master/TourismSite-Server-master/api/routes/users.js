const express=require('express');
const router=express.Router();
const DButilsAzure = require('./DButils');
const jwt=require('jsonwebtoken');
const secret = "doubleOSeven";

router.post('/login', (req, res)=>{
    try {
        const username = req.body.username;
        const password = req.body.password;
        if (username === undefined || password === undefined || username === "" || password === "") {
            res.status(404).send("Bad request");
            return;
        }
        DButilsAzure.execQuery(
            "select username from users where username='" + req.body.username + "' and pass='" + req.body.password + "'")
            .then(function (result) {
                if (result.length === 0)
                    res.json({
                        message: 'Username is not exist or password is incorrect'
                    });
                else {
                    const payload = {username: req.body.username, password: req.body.password};
                    const options = {expiresIn: "1d"};
                    const token = jwt.sign(payload, secret, options);
                    res.status(200).send(token);
                }
            })
            .catch(function (err) {
                console.log(err);
                res.status(404).send("Error occurred while login");
            });
    }
    catch (e) {
        console.log(e);
        res.status(404).send("Error occurred while login");
    }
});

router.get('/getAllQuestions', (req, res)=>{
    try {
        DButilsAzure.execQuery(
            "select * from questions")
            .then(function (result) {
                    res.status(200).send(result);
            })
            .catch(function (err) {
                console.log(err);
                res.status(404).send("Error occurred while getQuestion");
            });
    }
    catch (e) {
        console.log(e);
        res.status(404).send("Error occurred while login");
    }
});

router.post('/register', (req, res, next)=>{
    try {
        DButilsAzure.execQuery(
            "select * from users where [username]='"+req.body.username+"'")
            .then(function (result) {
                if(result.length>0)
                    res.status(404).send("Username is taken. Please choose other one.")
                else next();
            })
            .catch(function (err) {
                console.log(err);
                res.status(404).send("Error occurred while retrieving username");
            });
    }
    catch (e) {
        console.log(e);
        res.status(404).send("Error occurred while retrieving username");
    }
});


// categories ****
router.post('/register', (req, res, next)=>{
    const categories=req.body.categories;
    if (categories===undefined || categories.length<2) {
        res.status(404).send("Bad request - categories undefined");
        return;
    }
    let validationCheck = true;
    categories.forEach(function(category) {
        if(category===undefined || category.name===undefined || category.name==="")
            validationCheck=false;
        else {
            categories.forEach(function (category2) {
                if (category2.name !== undefined && category.name === category2.name && category !== category2)
                    validationCheck = false;
            });
        }
    });
    if(validationCheck===false)
        res.status(404).send("Bad request - categories values");
    else
        next();
});


//null checking for questions and answers
router.post('/register', (req, res, next)=> {
    if (req.body.question1===undefined || req.body.answer1===undefined
        || req.body.question2===undefined || req.body.answer2===undefined
        || req.body.question1==="" || req.body.answer1===""
        || req.body.question2==="" || req.body.answer2==="")
        res.status(404).send(' error - check your questions and answers');
    else
        next();
});


//checking if user insert 2 different questions
router.post('/register', (req, res, next)=> {
    if (req.body.question1===req.body.question2)
        res.status(404).send(' error - you need to insert two different questions');
    else
        next();
});


// checking question1
router.post('/register', (req, res, next)=>{
    DButilsAzure.execQuery(
        "select * from questions where [id]='"+req.body.question1+"'")
        .then(function(result){
            if(result.length!==1)
                res.status(404).send("question1 does not exists");
            else
                next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while retrieving the questions");
        });
});


// checking question2
router.post('/register', (req, res, next)=>{
    DButilsAzure.execQuery(
        "select * from questions where [id]='"+req.body.question2+"'")
        .then(function(result){
            if(result.length!==1)
                res.status(404).send("question2 does not exists");
            else
                next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while retrieving the questions");
        });
});


router.post('/register', (req, res, next)=> {
    const user = {
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        city: req.body.city,
        country: req.body.country,
        email: req.body.email
    };

    // null checking
    if (user.username === undefined || user.password === undefined ||
        user.firstName === undefined || user.lastName === undefined ||
        user.city === undefined || user.country === undefined || user.email === undefined ||
        user.username.length < 1 || user.password.length < 1 ||
        user.firstName.length < 1 || user.lastName.length < 1 ||
        user.city.length < 1 || user.country.length < 1 || user.email.length < 1) {
        res.status(404).send("Not all fields exists");
        return;
    }

   var counterEmail=0;
    var index=0;
    var counterDot=0;
    var indexDot=0;
    //email checking
   for (var i=0;i<user.email.length-1;i++){
       if (user.email[i]==='@') {
           counterEmail++;
           index=i;
       }
    }
    for (var i=index;i<user.email.length-1;i++){
        if (user.email[i]==='.') {
            counterDot++;
            indexDot=i;
        }
    }

   if (counterEmail!=1 || counterDot===0|| user.email.length-indexDot===0){
       res.status(404).send('illegal email');
       return;
   }


// user name checking
    if (user.username.length < 3 || user.username > 8) {
        res.status(404).send("Username's length illegal");
        return;
    }
    for (let i = 0; i < user.username.length; i++) {
        if (((user.username[i] >= 'a' && user.username[i] <= 'z') || (user.username[i] >= 'A' && user.username[i] <= 'Z')))
            continue;
        else {
            res.status(404).send('illegal username');
            return;
        }
    }

    // password checking
    if (user.password.length < 4 || user.password.length > 10) {
        res.status(404).send("invalid password - password must be between 5 to 10 notes");
        return;
    }
    for (let i = 0; i < user.password.length; i++)
        if (((user.password[i] >= 'a' && user.password[i] <= 'z') || (user.password[i] >= 'A' && user.password[i] <= 'Z'))
            || user.password[i] === '0' || user.password[i] === '1' || user.password[i] === '2' || user.password[i] === '3'
            || user.password[i] === '4' || user.password[i] === '5' || user.password[i] === '6'
            || user.password[i] === '7' || user.password[i] === '8' || user.password[i] === '9')
            continue;
        else {
            res.status(404).send('illegal password');
            return;
        }
    next();
});


// country checking
router.post('/register', (req, res, next)=> {
    const user = {
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        city: req.body.city,
        country: req.body.country,
        email: req.body.email
    };
    DButilsAzure.execQuery(
        "select * " +
        "from countries " +
        "where [countryName]='" + user.country + "';")
        .then(function (result) {
            if (result.length === 0)
                res.status(404).send("Country doesnt exists");
            else next();
        })
        .catch(function (err) {
            console.log(err);
            res.status(404).send("Error occurred while retrieving the countries");
        });
});


router.post('/register', (req, res, next)=> {
    const user = {
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        city: req.body.city,
        country: req.body.country,
        email: req.body.email
    };
    // user already exists checking
    DButilsAzure.execQuery(
        "select * from users where [username]='" + user.username + "'")
        .then(function (result) {
            if (result.length !== 0)
                res.status(200).send("user Already exists");
            else next();
        })
        .catch(function (err) {
            console.log(err);
            res.status(404).send("Error occurred while validate the username");
        });
});


router.post('/register', (req, res, next)=> {
    const user = {
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        city: req.body.city,
        country: req.body.country,
        email: req.body.email
    };
    DButilsAzure.execQuery(
        "insert into users values('" +
        user.username + "','" + user.password + "','" +
        user.firstName + "','" + user.lastName + "','" +
        user.city + "','" + user.country + "','" +
        user.email + "')")
        .then(()=>{next();})
        .catch(function (err) {
            console.log(err);
            res.status(404).send("Error occurred while insert the user");
        });
});

router.post('/register', (req, res, next)=>{
    DButilsAzure.execQuery(
        "insert into questionsForUsers values('"+
        req.body.username+"','"+req.body.question1+"','"+
        req.body.answer1+"')")
        .then(()=>{next();})
        .catch(function (err){
            console.log(err);
            deleteUser(req.body.username, res, "Error occurred while insert the first answer");
        });
});

router.post('/register', (req, res, next)=>{
    DButilsAzure.execQuery(
        "insert into questionsForUsers values('"+
        req.body.username+"','"+req.body.question2+"','"+
        req.body.answer2+"')")
        .then(()=>{next();})
        .catch(function (err){
            console.log(err);
            deleteUser(req.body.username, res, "Error occurred while insert the second answer");
        });
});

router.post('/register', (req, res)=> {
    let validateCategory=true;
    const categories=req.body.categories;
    let i=0;
    categories.forEach(function (category) {
            if(!validateCategory)
                return;
            DButilsAzure.execQuery(
                "SELECT * " +
                "FROM categories " +
                "WHERE [name]='" + category.name + "'")
                .then(function (result) {
                    if (result.length === 0) {
                        validateCategory = false;
                        deleteUser(req.body.username, res, "Bad request - a category does not exists");
                    }
                    else {
                        DButilsAzure.execQuery(
                            "insert into userCategories values('" +
                            req.body.username + "','" + category.name + "')")
                            .then(()=>{
                                i++;
                                if(i===categories.length)
                                    res.status(200).send("Done");
                            })
                            .catch(function (err) {
                                console.log(err);
                                deleteUser(req.body.username, res, "Error occurred while insert categories for user");
                                validateCategory = false;
                            });
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    deleteUser(req.body.username, res, "Error occurred while validate the categories");
                });
        }
    );
});


function deleteUser(username, res, message){
    DButilsAzure.execQuery(
        "DELETE FROM users " +
        "WHERE username='" + username + "'"
    )
        .then(() => {
            res.status(404).send("Bad request - a category does not exists");
        })
        .catch(function (err){
            console.log(err);
            res.status(404).send(message);
        });
}

router.get('/getMyQuestions/:username', (req, res)=>{
    const username = req.params.username;
    if(username===undefined || username===""){
        res.status(404).send("Bad request - username");
        return;
    }
    DButilsAzure.execQuery(
        "select id questionID,content " +
        "from questions join questionsForUsers " +
        "on questions.id=questionsForUsers.question " +
        "where [user]='"+username+"';")
        .then(function(result){
            if(result.length!==2)
                res.status(404).send("User does not exists");
            else
                res.status(200).json({
                    questions: result
                });
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("error while getting the questions");
        });
});

router.post('/restorePassword', (req, res)=>{
    const username = req.body.username;
    const questionID = req.body.questionID;
    const answer = req.body.answer;
    if(username===undefined || username===""
        || questionID===undefined || questionID==="" || questionID<0
        || answer===undefined || answer===""){
        res.status(404).send("Bad request");
        return;
    }
    DButilsAzure.execQuery(
        "select pass " +
        "from users join questionsForUsers " +
        "on [user]=username "+
        "where [user]='"+username+"' and question="+questionID+" and answer='"+answer+"';")
        .then(function(result){
            console.log(result.length);
            if(result.length===0)
                res.status(404).send("User does not exists or wrong answer");
            else
                res.status(200).json(result);
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while retrieving the password");
        });
});


module.exports = router;




