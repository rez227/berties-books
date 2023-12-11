module.exports = function (app, shopData) {
    const { check, validationResult } = require('express-validator');
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login')
        } else { next(); }
    }

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

    app.post('/registered', [check('email').isEmail()], check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
        function (req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./register');
            }
            else {
                // Checks if the username already exists
                let existingUserQuery = "SELECT * FROM userdetails WHERE username = ?";
                db.query(existingUserQuery, [req.sanitize(req.body.username)], (err, result) => {
                    if (err) {
                        return res.status(500).send('Internal Server Error');
                    }

                    if (result.length > 0) {
                        return res.send('This username has been taken. Please choose another username.');
                    }

                    // If the username is unique, continue with the insertion
                    const bcrypt = require('bcrypt');
                    const saltRounds = 10;
                    const plainPassword = req.sanitize(req.body.password);

                    bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
                        // Store hashed password in your database.
                        let sqlquery = "INSERT INTO userdetails (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
                        // execute sql query
                        let newrecord = [req.sanitize(req.body.username), req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), hashedPassword];

                        db.query(sqlquery, newrecord, (err, result) => {
                            if (err) {
                                return console.error(err.message);
                            } else {
                                result = 'Hello ' + req.sanitize(req.sanitize(req.body.first)) + ' ' + req.sanitize(req.body.last) + ' you are now registered!  We will send an email to you at ' + req.body.email;
                                //result += 'Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                                res.send(result);

                            }
                        });
                    });
                });
            }
        });
    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM categories"; // query database to get all the categories
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availablecategories: result });
            console.log(newData);
            res.render("list.ejs", newData)
        });
    });
    //a new route for list users
    app.get('/listusers', function (req, res) {
        let sqlquery = "SELECT username, first_name, last_name, email FROM userdetails"; // Query database to get user details
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { userList: result });
            console.log(newData);
            res.render("listusers.ejs", newData);
        });
    });
    //Log in system

    app.get('/login', function (req, res) {
        res.render('login.ejs', shopData);
    });

    app.post('/loggedin', function (req, res) {
        // Compare the form data with the data stored in the database
        let sqlquery = "SELECT hashedPassword FROM userdetails WHERE username = ?"; // query database to get the hashed password for the user
        // execute sql query
        let username = (req.sanitize(req.body.username));
        db.query(sqlquery, username, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else if (result.length == 0) {
                // No user found with that username
                res.send('Invalid username or password');
            }
            else {
                // User found, compare the passwords
                let hashedPassword = result[0].hashedPassword;
                const bcrypt = require('bcrypt');
                bcrypt.compare((req.sanitize(req.body.password)), hashedPassword, function (err, result) {
                    if (err) {
                        // Handle error
                        return console.error(err.message);
                    }
                    else if (result == true) {
                        // Save user session here, when login is successful
                        req.session.userId = req.sanitize(req.body.username);
                        // The passwords match, login successful
                        res.send('Welcome, ' + (req.body.username) + '!' + '<a href=' + './' + '>Home</a>');

                    }
                    else {
                        //  login failed
                        res.send('Invalid username or password');
                    }
                });
            }
        });
    });
    //Logout
    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
        })
    })


    app.get('/addOutfit', function (req, res) {
        res.render('addOutfit.ejs', shopData);
    });

    app.post('/Outfitadded', function (req, res) {
        // saving data in database
        let sqlquery = "INSERT INTO categories (occasion, colour, budget) VALUES (?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.occasion), req.sanitize(req.body.colour), req.sanitize(req.body.budget)];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else
                res.send(' This book is added to database, occasion: ' + req.sanitize(req.body.occasion) + ' budget ' + req.sanitize(req.body.budget));
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
