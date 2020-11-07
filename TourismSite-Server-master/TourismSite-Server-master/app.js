const express =  require("express");
const app = express();
const bodyParser = require('body-parser');
const usersRoutes = require('./api/routes/users');
const pointsRoutes = require('./api/routes/points');
const categoriesRoutes = require('./api/routes/categories');
const DButilsAzure = require('./api/routes/DButils');
const cors=require('cors');

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/users', usersRoutes);
app.use('/points', pointsRoutes);
app.use('/categories', categoriesRoutes);

app.get('/getCountries', (req, res)=> {
    DButilsAzure.execQuery(
        "SELECT * FROM countries")
        .then(function (result) {
            res.status(200).json({
                countries:result
            })
        })
        .catch(function (err) {
            console.log(err);
            res.status(404).send("Cannot access to the countries");
        });
});

app.use((req, res, next)=>{
   const error = new Error('not found');
   error.status = 404;
   next(error);
});

app.use((error, req, res)=>{
   res.status(error.status || 500);
   res.json({
      error: {message: error.message}
   });
});

module.exports = app;