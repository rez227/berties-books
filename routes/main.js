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
        const keyword = '%' + req.query.keyword + '%';

        // Perform the search in "categories" table
        const query = `
            SELECT 'categories' AS category, occasion, colour, budget FROM categories 
            WHERE occasion LIKE ? OR colour LIKE ? OR budget LIKE ?`;

        db.query(query, [keyword, keyword, keyword], (err, results) => {
            if (err) {
                console.error('Error executing the search query:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            let newData = Object.assign({}, shopData, { results: results });
            // Process the search results
            res.render('result.ejs', newData);
        });
    });

    //weather API

    const request = require('request');

    app.get('/weather', function (req, res) {
        res.render('weather');
    });

    app.post('/weather', function (req, res) {
        let apiKey = '3d6f48214e9fccaf110e17b76a5bf280';
        let city = req.body.city;
        let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        request(url, function (err, response, body) {
            if (err) {
                console.log('Error:', err);
                res.send('Error fetching weather data.');
            } else {
                try {
                    var weather = JSON.parse(body);

                    if (weather && weather.main) {
                        var wmsg = 'It is ' + weather.main.temp +
                            ' degrees in ' + weather.name +
                            '! <br> The humidity now is: ' +
                            weather.main.humidity +
                            '! <br> Wind speed: ' + (weather.wind ? weather.wind.speed : 'N/A') +
                            ', Direction: ' + (weather.wind ? weather.wind.deg : 'N/A');
                        res.send(wmsg);
                    } else {
                        res.send("No valid weather data found.");
                    }
                } catch (parseError) {
                    console.log('Error parsing JSON:', parseError);
                    res.send('Error parsing weather data.');
                }
            }
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
                                result = 'Hello ' + req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) + ' you are now registered!  We will send an email to you at ' + req.body.email;
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
    //delete user
    app.get('/eliminateuser', redirectLogin, function (req, res) {
        res.render('eliminateuser.ejs', shopData);
    });
    app.post('/usereliminated', redirectLogin, function (req, res) {
        const usernameToEliminate = req.sanitize(req.body.username);

        // Perform the deletion in the database
        const deleteQuery = "DELETE FROM userdetails WHERE username = ?";
        db.query(deleteQuery, [usernameToEliminate], (err, result) => {
            if (err) {
                console.log('Error eliminating user:', err);
                res.status(500).send('Internal Server Error');
            } else {
                console.log('Result:', result);

                if (result.affectedRows > 0) {
                    console.log('User eliminated successfully');
                    res.send('The user has successfully been eliminated. <a href=' + './' + '>Home</a>');
                } else {
                    console.log('User not found');
                    res.send('We were not able to locate this user. Please try again later <a href=' + './' + '>Home</a>');
                }
            }
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


    // This is an API
    const http = require('https');
    app.get('/checkPrice', function (req, res) {
        const options = {
            method: 'GET',
            hostname: 'exchange-rate-api1.p.rapidapi.com',
            port: null,
            path: '/convert?base=USD&target=GBP',
            headers: {
                'X-RapidAPI-Key': '9eedca4fd5msh5af26b25ea04c8cp125324jsne858df1f6b2e',
                'X-RapidAPI-Host': 'exchange-rate-api1.p.rapidapi.com'
            }
        };

        const apiReq = http.request(options, function (apiRes) {
            const chunks = [];

            apiRes.on('data', function (chunk) {
                chunks.push(chunk);
            });

            apiRes.on('end', function () {
                const body = Buffer.concat(chunks);
                const result = JSON.parse(body.toString());

                // Render the EJS template with the exchange rate information
                res.render('checkPrice', { result });
            });
        });

        apiReq.end();
    });
}
//make sure to add validation where you cannot put Integers where it says first name and last name