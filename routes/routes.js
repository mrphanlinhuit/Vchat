module.exports = function(app){
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    
    app.route('/')
        .get(function(req, res, next){
            res.render('index2');//load the index.ejs file
        });

    app.route('/index')
        .get(function(req, res, next){
            res.render('index2');
        });
    
    app.route('/chat')
        .get(function(req, res, next){
            res.render('chat2');
        });

    app.route('/newroom')
        .get(function(req, res, next){
            res.render('chat2');
        })
        .post(function(req, res, next){
            console.log('>> create new room: ', req.body);
            res.render('chat2', {data: req.body});
        });

    app.route('/joinroom')
        .get(function(req, res, next){
            res.render('index2');
        })
        .post(function(req, res, next){
            console.log('>> join room: ', req.body);
            res.render('chat2', {data: req.body});
        });

    app.route('/multi')
        .get(function(req, res, next){
            res.render('Multi-Broadcasters-and-Many-Viewers');
    });
};