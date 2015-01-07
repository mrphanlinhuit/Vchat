/**
 * Created by linh on 06/01/2015.
 */

// load the things we need.
var mongoose = require('mongoose');


// define the schema for our feedback model.
var feedbackSchema = mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    content: String,
    date: Date
});

//create the model and expose to our app.
module.exports = mongoose.model('feedback', feedbackSchema);