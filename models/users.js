/**
 * Created by linh on 07/01/2015.
 */
//==load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//=== define the schema for the user model
var userSchema = mongoose.Schema({
    email: String,
    password: String,
    name: String,
    birthday: Date,
    birthplace: String,
    dateOfRegistration: Date
});

//===methods
//generating a hash
userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking password is valid
userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

//=== create the the models for users and expose to app
module.exports = mongoose.model('user', userSchema);