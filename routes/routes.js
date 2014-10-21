module.exports = function(app){
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    
    app.route('/')
        .get(function(req, res, next){
            res.render('index');//load the index.ejs file
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
};