var feedbackModel = require('../models/feedbacks');
var randQuestionModel = require('../models/randomQuestions');
var userModel = require('../models/users');

module.exports = function(app, passport){
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    
    app.route('/')
        .get(function(req, res, next){
            randQuestionModel.getRandom(function(err, q){
                if(err) next(err);
                var question = {id: q[0].id, question: q[0].question};
                var data = {host: req.host, randQuestion: question};
                res.render('index', {data: data});//load the index.ejs file
            });
        });
    app.route('/index')
        .get(function(req, res, next){
            res.render('index');
        });

    app.route('/chat')
        .get(function(req, res, next){
            res.render('chat');
        });

    app.route('/newroom')
        .get(function(req, res, next){
            res.render('chat');
        })
        .post(function(req, res, next){
            console.log('>> create new room: ', req.body);
            res.render('chat', {data: req.body});
        });

    app.route('/joinroom')
        .get(function(req, res, next){
            res.render('index');
        })
        .post(function(req, res, next){
            console.log('>> join room: ', req.body);
            res.render('chat', {data: req.body});
        });

    app.route('/multi')
        .get(function(req, res, next){
            res.render('Multi-Broadcasters-and-Many-Viewers');
    });

    app.route('/feedback')
        .get()
        .post(function(req, res, next){

            if(req.body.honeyPot === '') {
                var randQuestion = req.body.idQuestion;
                var answer = req.body.answer;
                randQuestionModel.validateAnswer(randQuestion, function(err, q){
                    if(err) next(err);

                    if(q.answer === answer){
                        var newFeedback = new feedbackModel();
                        newFeedback.name = req.body.name;
                        newFeedback.email = req.body.email;
                        newFeedback.subject = req.body.subject;
                        newFeedback.content = req.body.content;
                        newFeedback.date = Date();

                        newFeedback.save(function (err, product, numberAffected) {
                            if (err) next(err);

                            console.log('#### numberAffected: ', numberAffected);
                        });
                        res.send('ok');
                    }
                    else res.send('wrong answer');
                });
            }else{
                res.render('index');
            }
        });



    //====== Admin
    app.route('/admin')
        .get( isLoggedIn, function(req, res, next){
            res.render('admin');
        });

    app.route('/admin/login')
        .get(function(req, res, next){
            var data = {host: 'http://'+req.headers.host, message: req.flash('loginMessage')};
            res.render('login', {data: data});
        })
        .post(passport.authenticate('local-login',{
            successRedirect: '/admin',
            failureRedirect: '/admin/login',
            failureFlash: true // allow flash message
        }));

    app.route('/admin/logout')
        .get(function(req, res, next){
            req.logout();
            res.redirect('/admin');
        })
        .post();

    app.route('/admin/signup')
        .get(function(req, res, next){
            var data = {host: 'http://'+req.headers.host, message: req.flash('loginMessage')};
            res.render('signup', {data: data});
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/admin/feedbacks',
            failureRedirect: '/',
            failureFlash: true //allow flash message
        }));

    //random questions
    app.route('/admin/getListQuestion')
        .get(isLoggedIn, function(req, res, next){
            randQuestionModel
                .find({})
                .skip(0)
                .limit()
                .exec(function(err, questions){
                    res.send(questions);
                });
        })
        .post();

    app.route('/admin/addRandomQuestion')
        .get(isLoggedIn, function(req, res, next){
            res.redirect('/admin');
        })
        .post(isLoggedIn, function(req, res, next){
            console.log('**** req.body', req.body);
            var newQuestion = new randQuestionModel();
            newQuestion.question = req.body.question;
            newQuestion.answer = req.body.answer;
            newQuestion.save(function(err){
                if(err) next(err);
                res.redirect('/admin/addRandomQuestion');
            });
        });

    app.route('/admin/removeRandomQuestion')
        .get()
        .post(isLoggedIn, function(req, res, next){
            var id = req.body.id;
            if(id !== ''){
                randQuestionModel.findByIdAndRemove(id, function(err, q){
                    if(err) next(err);
                    res.send('ok');
                });
            }else res.send('id is empty');
        });

    app.route('/admin/updateRandomQuestion')
        .get()
        .post(isLoggedIn, function(req, res, next){
            var id = req.body.id;
            var question = req.body.question;
            var answer = req.body.answer;
            randQuestionModel.findByIdAndUpdate(id, {$set:{question: question, answer: answer}}, function(err, q){
                if(err) next(err);
                res.send('ok');
            });
        });

    //feedbacks
    app.route('/admin/feedbacks')
        .get(isLoggedIn, function(req, res, next){
            var limit = 50;
            var page = req.param('page', 0);
            var start = limit*page;
            feedbackModel
                .find({})
                .skip(0)
                .limit()
                .exec(function(err, feedbacks){
                    var count;
                    if(err) next(err);

                    res.send(feedbacks);
                });
        })
        .post(isLoggedIn, function(req, res, next){
            var limit = 50;
            var page = req.body.page;
            console.log('**** page: ', page);
            console.log('**** req: ', req.body);
            var start = limit*page;
            feedbackModel
                .find({})
                .skip(0)
                .limit()
                .exec(function(err, feedbacks){
                    if(err) next(err);
                        res.send(feedbacks);
                });
        });

    app.route('/admin/feedback/delete')
        .get()
        .post(isLoggedIn, function(req, res, next){
            if(req.body.id !== ''){
                var id = req.body.id;
                feedbackModel.findByIdAndRemove(id, function(err, feedback){
                    if(err) next(err);
                    res.send('ok');
                });
            }else{
                res.send('id was empty');
            }
        });

    app.route('/admin/users')
        .get(isLoggedIn, function(req, res, next){
            userModel
                .find({})
                .skip(0)
                .limit()
                .exec(function(err, users){
                    if(err) next(err);
                    res.send(users);
                });
        })
        .post();

    app.route('/admin/addUser')
        .get()
        .post(isLoggedIn, function(req, res, next){
            var newUser = new userModel();
            newUser.email = req.body.email;
            newUser.password = newUser.generateHash(req.body.password);
            newUser.name = req.body.name;
            newUser.birthday = req.body.birthday;
            newUser.birthplace = req.body.birthplace;
            newUser.dateOfRegistration = Date();
            newUser.save(function(err){
                if(err) next(err);
                res.send('ok');
            });

        });

    app.route('/admin/updateUser')
        .get()
        .post(isLoggedIn, function (req, res, next) {
            var newUser = new userModel();
            var id = req.body.id;
            var email = req.body.email;
            var password = newUser.generateHash(req.body.password);
            var name = req.body.name;
            var birthday = req.body.birthday;
            var birthplace = req.body.birthplace;
            userModel.findByIdAndUpdate(id, {$set:{email: email,
                password: password, name: name, birthday: birthday, birthplace: birthplace}}, function(err, q){
                if(err) next(err);
                res.send('ok');
            });
        });

    app.route('/admin/deleteUser')
        .get()
        .post(isLoggedIn, function(req, res, next){
            var id = req.body.id;
            userModel.findByIdAndRemove(id, function(err, user){
                if(err) next(err);
                res.send('ok');
            })
        });
};

//== route middleware to make sure a user is logged in.
function isLoggedIn(req, res, next){
    //if user is authenticated in the session, carry on
    if(req.isAuthenticated()){
        return next();
    }
    //if they aren't, redirect them to home page.
    console.log('user didnt logg in');
    res.redirect('/admin/login');
}