var feedbackModel = require('../models/feedbacks');

module.exports = function(app){
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    
    app.route('/')
        .get(function(req, res, next){
            res.render('index');//load the index.ejs file
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
                var newFeedback = new feedbackModel();
                newFeedback.name = req.body.name;
                newFeedback.email = req.body.email;
                newFeedback.subject = req.body.subject;
                newFeedback.content = req.body.content;
                newFeedback.date = Date();

                newFeedback.save(function (err, product, numberAffected) {
                    if (err) next(err);

                    console.log('#### product: ', product);
                    console.log('#### numberAffected: ', numberAffected);
                });
                res.send('ok');
            }else{
                res.render('index');
            }
        });



    //====== Admin
    app.route('/admin/feedbacks')
        .get(function(req, res, next){
            var limit = 5;
            var page = req.param('page', 0);
            var start = limit*page;
            feedbackModel
                .find({})
                .skip(start)
                .limit(limit)
                .exec(function(err, feedbacks){
                    var count;
                    if(err) next(err);
                    feedbackModel.count({},function(err, count){
                        if(err) next(err)
                        console.log('$$$$$ count: ', count);
                        var data = {feedbacks: feedbacks, count: count};
                        res.render('feedbacks', {'data': data});
                    });
                });
        })
        .post();

    app.route('/admin/feedback/delete')
        .get()
        .post(function(req, res, next){
            if(req.body.id !== ''){
                var id = req.body.id;
                feedbackModel.findByIdAndRemove(id, function(err, feedback){
                    if(err) next(err);
                    console.log('remove feedback: ', feedback);
                    res.send('ok');
                });
            }else{
                res.send('id was empty');
            }
        });
};