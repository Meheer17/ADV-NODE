'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const passport = require('passport');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const app = express();
const routes = require('./routes');
const auth = require('./auth.js');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const http = require('http').createServer(app);
const io = require('socket.io')(http)

app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purpos

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {secure: false}  
}));
app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
    const adn = await client.db('database').collection('users');

    routes(app, adn);
    auth(app, adn);

    io.on('connection', socket => {
        console.log('A user has connected')
    });

}).catch((e) => {
    app.route('/').get((req, res) => {
        res.render("pug", {title: e, message: "unable to login"} )
    });
});

function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
};

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
