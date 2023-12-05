module.exports = function (app, shopData) {

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search', function (req, res) {
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM categories WHERE occasion LIKE '%" + req.query.keyword + "%'"; // query database to get all the categories
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availablecategories: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });
    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);

    });
    app.post('/registered', function (req, res) {
        // saving data in database
        res.send(' Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered!  We will send an email to you at ' + req.body.email);
    });
    app.get('/list', function (req, res) {
        let sqlquery = "SELECT * FROM categories"; // query database to get all the categories
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availablecategories: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    app.get('/addOutfit', function (req, res) {
        res.render('addOutfit.ejs', shopData);
    });

    app.post('/Outfitadded', function (req, res) {
        // saving data in database
        let sqlquery = "INSERT INTO categories (occasion, colour, budget) VALUES (?,?,?)";
        // execute sql query
        let newrecord = [req.body.occasion, req.body.colour, req.body.budget];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else
                res.send(' This book is added to database, occasion: ' + req.body.occasion + ' budget ' + req.body.budget);
        });
    });

    app.get('/sale', function (req, res) {
        let sqlquery = "SELECT * FROM categories WHERE budget < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availablecategories: result });
            console.log(newData)
            res.render("sale.ejs", newData)
        });
    });

}
