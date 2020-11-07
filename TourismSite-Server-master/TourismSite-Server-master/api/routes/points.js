const express=require('express');
const router=express.Router();
const DButilsAzure = require('./DButils');
const jwt=require('jsonwebtoken');
const secret = "doubleOSeven";

router.use('/private', (req, res, next)=>{
    const token = req.header("x-auth-token");
    // no token
    if (!token)
        res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        req.decoded = jwt.verify(token, secret);
        next();
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});

router.get('/getAllPoints', (req, res)=>{
    DButilsAzure.execQuery(
        "SELECT * FROM points")
        .then(function(result){
            if(result.length===0)
                res.status(404).send("No points in the system");
            else
                res.status(200).json({
                    points:result
                });
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while retrieving the points");
        });
});

router.get('/getPoint/:pointName', (req, res, next)=>{
    const pointName = req.params.pointName;
    if(pointName===undefined || pointName===""){
        res.status(404).send("Bad request");
        return;
    }
    DButilsAzure.execQuery(
        "SELECT [name] FROM points where [name]='"+pointName+"';")
        .then(function(result){
            if(result.length===0)
                res.status(404).send("There is no such point");
            else {
                next();
            }
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while finding this point");
        });
});

router.get('/getPoint/:pointName', (req, res)=> {
    const pointName = req.params.pointName;
    DButilsAzure.execQuery(
        "update points "+
        "set numOfViewers=numOfViewers+1 "+
        "where [name]='"+pointName+"';"+
        "SELECT * FROM points where [name]='"+pointName+"';")
        .then(function(result){
            console.log(result);
            res.status(200).json({
                points: result
            })
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while updating this point viewers");
        });
});

router.get('/getLastTwoReviews/:pointName', (req, res)=>{
    const pointName = req.params.pointName;
    if(pointName===undefined || pointName===""){
        res.status(404).send("Bad request");
        return;
    }
    DButilsAzure.execQuery(
        "select top 2 [user],review,[date] from reviews join points on reviews.[point]=points.[name] where reviews.[point]='"+pointName+"'order by [date] desc;")
        .then(function(result){
            if(result.length===0)
                res.status(404).send("There is no such point or there are no reviews for that point");
            else
                res.status(200).json({
                    twoReviews:result
                });
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while retrieving this point's reviews");
        });
});

router.post('/private/rankPoint', (req, res, next)=>{
    const pointName = req.body.pointName;
    if(req.body.rank===undefined || pointName===undefined || pointName==="") {
        res.status(404).send("Bad request");
        return;
    }
    const rank=parseFloat(req.body.rank);
    if(rank>5 || rank<1|| !Number.isInteger(rank)) {
        res.status(404).send("Rank should be an integer between 1 to 5");
        return;
    }
    DButilsAzure.execQuery(
        "SELECT * " +
        "FROM points " +
        "WHERE [name]='"+pointName+"'")
        .then(function(result){
            if(result.length===0){
                res.status(404).send("This point does not exist");
            }
            else next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while checking this point");
        });
});

router.post('/private/rankPoint', (req, res, next)=> {
    const pointName = req.body.pointName;
    DButilsAzure.execQuery(
        "SELECT * " +
        "FROM rankedPoints " +
        "where [user]='"+req.decoded.username+"' and point='"+pointName+"'")
        .then(function(result){
            if(!(result.length===0))
                res.json({
                    message: 'You have already ranked this points'
                });
            else next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while checking if the user ranked this point");
        });
});

router.post('/private/rankPoint', (req, res, next)=> {
    DButilsAzure.execQuery(
        "insert into rankedPoints values('"+req.decoded.username+"','"+req.body.pointName+"',"+req.body.rank+")")
        .then(function(){
            next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while ranking the point");
        });
});

router.post('/private/rankPoint', (req, res)=> {
    DButilsAzure.execQuery(
        "update points " +
        "set [rank]=av " +
        "from " +
        " (select avg(cast([rank] as decimal(10,2) ) ) /5*100 as av " +
        " from rankedPoints " +
        " where point='"+ req.body.pointName +"') as T " +
        "where [name]='"+ req.body.pointName +"'"
    )
        .then(function(){
            res.status(200).send("Done");
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send("Error occurred while calculation the point rank");
        });
});

// checking if point exists
router.post('/private/writeReviewOnPoint', (req, res, next)=>{

    if (req.body.review===undefined || req.body.pointName===undefined || req.body.review.length===0
        || req.body.pointName.length===0)
        res.status(404).send('review point error: Empty field');
    DButilsAzure.execQuery(
        "SELECT * FROM points where [name]='"+req.body.pointName+"'")
        .then(function(result){
            if(result.length===0)
                res.status(201).json({
                    message: 'not such point'
                });
            else next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send(err);
        });
});

// check if user already wrote review of the point
router.post('/private/writeReviewOnPoint', (req, res, next)=>{
    DButilsAzure.execQuery(
        "SELECT * FROM reviews where [user]='"+req.decoded.username+"' and point='"+req.body.pointName+"'")
        .then(function(result){
            if (result.length===1) res.status(404).send('user already reviewed the point');
            else
                next();
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send(err);
        });
});

router.post('/private/writeReviewOnPoint', ( req, res)=> {
    DButilsAzure.execQuery(
        "insert into reviews values('"+req.decoded.username+"','"+req.body.pointName+"','"+req.body.review+"', GETDATE())")
        .then(function(){
            res.status(200).send('ok review inserted');
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send(err);
        });
});

router.get('/private/getLastTwoPoints', (req, res)=>{
    DButilsAzure.execQuery(
        "select top 2 * "+
        "from savedPoints join users "+
        "on username=[user] "+
        "where [user]='"+req.decoded.username+"' "+
        "order by [savedDate] desc;")
        .then(function(result) {
            res.status(200).json({
                points: result
            })
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send(err);
        });
});

router.get('/private/getFavoritesPoints', (req, res)=>{
    DButilsAzure.execQuery(
        "select * "+
        "from savedPoints join points "+
        "on savedPoints.point=points.[name] "+
        "where savedPoints.[user]='"+req.decoded.username+"' " +
        "order by savedPoints.internalRank asc")
        .then(function(result){
            res.status(200).json({
                points: result
            })
        })
        .catch(function(err){
            console.log(err);
            res.status(404).send(err);
        });
});

router.put('/private/addPointsToFavorites', (req, res, next)=>{
    const points=req.body.points;
    if(points===undefined){
        res.status(404).send("Bad request");
        return;
    }
    let validationCheck = true;
    points.forEach((point)=>{
        if(point===undefined || point.name===undefined
            || point.name==="" || point.internalRank===undefined
            || !Number.isInteger(parseFloat(point.internalRank))
            ||  parseFloat(point.internalRank)<0){
            validationCheck=false;
        }
        points.forEach((point2)=>{
            if(point.name===point2.name &&
                point.internalRank!==point2.internalRank)
                validationCheck=false;
        })
    });
    if(!validationCheck) {
        res.status(404).send("Bad request");
        return;
    }
    points.forEach((point) => {
        DButilsAzure.execQuery(
            "SELECT * " +
            "FROM points " +
            "WHERE [name]='" + point.name + "'")
            .then(function (result) {
                if (result.length === 0)
                    validationCheck = false;
            })
            .catch(function (err) {
                console.log(err);
                validationCheck = false;
            });
    });
    if(!validationCheck)
        res.status(404).send("Bad request");
    else
        next();
});

router.put('/private/addPointsToFavorites', (req, res, next)=> {
    const points=req.body.points;
    points.forEach((point) => {
        console.log(point.name);
        let query=/*"DELETE FROM savedPoints WHERE [user]='"+req.decoded.username+"'\n"+*/
            "IF EXISTS (SELECT * " +
            "FROM savedPoints " +
            "WHERE point='" + point.name + "' and [user]='"+req.decoded.username+"') " +
            "UPDATE savedPoints " +
            "SET internalRank=" + point.internalRank + " " +
            "WHERE [point]='" + point.name + "' and [user]='" +
            req.decoded.username + "' " +
            "ELSE ";
        if(point.date===null || point.date===undefined || point.date==="")
            query+="INSERT INTO savedPoints VALUES ('" + req.decoded.username + "','" + point.name + "',GETDATE()," + point.internalRank + ")";
        else
            query+="INSERT INTO savedPoints VALUES ('" + req.decoded.username + "','" + point.name + "',"+point.date+"," + point.internalRank + ")";
        DButilsAzure.execQuery(query)
            .catch(function (err) {
                console.log(err);
                res.status(404).send("Error occurred while adding the points to favorites");
            });
    });
    next();
});

router.put('/private/addPointsToFavorites', (req, res)=> {
    const toDelete=req.body.toDelete;
    toDelete.forEach((point)=>{
        console.log("deleting: "+point.name);
        DButilsAzure.execQuery(
            "Delete FROM savedPoints WHERE [user]='"+
            req.decoded.username + "' AND [point]='"+point.name+"'")
            .catch(function (err) {
                console.log(err);
                res.status(404).send("Error occurred while removing points from favorites");
            });
    });
    res.status(200).send("Done");
});

module.exports = router;