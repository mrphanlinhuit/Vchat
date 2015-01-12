/**
 * Created by linh on 08/01/2015.
 */
//==load the things we need
var mongoose = require('mongoose');


//==define the schema for the randomQuestion
var randQuestion = mongoose.Schema({
    question: String,
    answer: String
});

randQuestion.statics.getRandom = function(cb){
    this.count(function(err, count){
        if(err) return cb(err, null);
        var rand = Math.floor(count * Math.random());
        if(rand === count) rand -= 1;
        this.find({}).skip(rand).limit(1).exec(cb);
    }.bind(this));
};

randQuestion.statics.validateAnswer = function(idQuestion, cb){
    this.findById(idQuestion)
        .limit(1)
        .exec(cb);
}

//expose the schema for our app
module.exports = mongoose.model('randQuestion', randQuestion);