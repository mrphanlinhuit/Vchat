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
    
    app.route('/multi')
        .get(function(req, res, next){
            res.render('Multi-Broadcasters-and-Many-Viewers');
    });
};