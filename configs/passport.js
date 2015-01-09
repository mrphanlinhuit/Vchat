/**
 * Created by linh on 07/01/2015.
 */
//===load the things we need.
var localStrategy = require('passport-local').Strategy;
//load up the user model
var userModel = require('../models/users');

//expose this function to our app
module.exports = function(passport){
    //passport session setup
    //required for persistent login sessions
    //passport needs ability to serialize and unserialize users out of session

    //used to serialize the user for the session
    passport.serializeUser(function(user, next){
        next(null, user.id);
    });

    //used to deserialize the user
    passport.deserializeUser(function(id, next){
        userModel.findById(id, function(err, user){
            next(err, user);
        });
    });

    //===local signup
    //we are using named strategies since we have one for login and one for singup
    //by default, if there was no name, it would just be call 'local'
    passport.use('local-signup', new localStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true //allows us to pass back the entire request to the callback
    }, function(req, email, password, next){
        console.log('%%%%local-signup: ', req);
        //asynchronous
        //userModel.findOne won't fire unless data is sent back.
        if(email !== '' && validateEmail(email));
        else{
            return next(null, false, req.flash('signupMessage', 'that email is invalid'));
        }

        if(password !== '' && validatePassword(password));
        else{
            return next(null, false, req.flash('signupMessage', 'that password is invalid'));
        }

        process.nextTick(function(){
            userModel.findOne({'email': email}, function(err, user){
                if(err) next(err);

                //check to see if there already a user with that email
                if(user){
                    return next(null, false, req.flash('signupMessage', 'that email is already taken'));
                }else{
                    //if there no user with that email
                    var newUser = new userModel();
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.name = req.body.name;
                    newUser.birthday = req.body.birthday;
                    newUser.birthplace = req.body.birthplace;
                    newUser.dateOfRegistration = Date();

                    //save the new user
                    newUser.save(function (err) {
                        if(err) throw err;
                        return next(null, newUser);
                    });
                }
            });
        });
    }));


    //===local login
    passport.use('local-login', new localStrategy({
        //by default, local strategy uses username and password, we will overwrite with email and password
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback.
    }, function(req, email, password, next){ //callback with email and password from our form.
        //find a user whose email is the same as the form's email.
        //we are checking to see if the user trying to login already exists.
        userModel.findOne({'email': email}, function(err, user){
            //if there is any error, return the error before anything else
            if(err) return next(err);

            //if no user is found, return the message
            //the req.flash is the way to set flashdata using connect-flash
            if(!user) return next(null, false, req.flash('loginMessage', 'no user found.'));

            //if user is found, but the password is wrong
            if(!user.validPassword(password)) return next(null, false, req.flash('loginMessage', 'Oops, wrong password.'));

            //all is well, return successful user
            return next(null, user);
        });
    }));
};

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePassword(pwd){
    /*
     This regex will enforce these rules:
     At least one upper case english letter
     At least one lower case english letter
     At least one digit
     At least one special character
     Minimum 8 in length
     */
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(pwd);
}

function validateDate(date){
    //This code will validate date format DD/MM/YY
    //return /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{2}$/.test(date);


    //This is working for me for MM/dd/yyyy.
    return /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(date);
}