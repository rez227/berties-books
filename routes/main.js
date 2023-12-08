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
        // Checks if the username already exists
        let existingUserQuery = "SELECT * FROM userdetails WHERE username = ?";
        db.query(existingUserQuery, [req.body.username], (err, result) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            if (result.length > 0) {
                return res.send('This username has been taken. Please choose another username.');
            }

            // If the username is unique, continue with the insertion
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const plainPassword = req.body.password;

            bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
                // Store hashed password in your database.
                let sqlquery = "INSERT INTO userdetails (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
                // execute sql query
                let newrecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];

                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    } else {
                        result = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered!  We will send an email to you at ' + req.body.email;
                        //result += 'Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                        res.send(result);
                    }
                });
            });
        });
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
