var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
var bcrypt = require('bcrypt-nodejs');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser())
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser('secret'));
  app.use(express.session())
});

app.get('/', function(req, res) {
  res.render('signup');
});

// Create a shortly link.
app.get('/create', util.checkUser, function(req, res) {
  res.render('index');
});

// User's shortly link index.
app.get('/links', util.checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    links.query(function(qb){
      qb.where({user_id: req.session.user});
    }).fetch().then(function(userLinks){
      res.send(200, userLinks.models);
    });
  });
});

// Post request for generating new shortly link.
app.post('/links', util.checkUser, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri, user_id: req.session.user }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          user_id: req.session.user
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// Signup route.
app.get('/signup', function(req, res) {
  res.render('signup');
});

// Login route.
app.get('/login', function(req, res) {
  res.render('login');
});

// Users post route. Should not be renderable.
app.get('/users', function(req, res) {
  Users.reset().fetch().then(function(users) {
    res.send(200, users.models);
  });
});

// Signup route.
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // Search for username in database and redirect to login if found.
  new User({ username: username, password: password }).fetch().then(function(found) {
    if (found) {
      res.redirect('/login ');
    } else {
      var user = new User({
        username: username,
        password: password
      });

      // Password is hashed and stored on creation.
      user.save().then(function(newUser) {
        Users.add(newUser);
        util.createSession(req, res, user);
      });
    }
  });
});

// Login route.
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(user) {
    // Redirect to login if username not found.
    if (!user) {
      console.log(user);
      res.redirect('/login');
    }
    else {
      // Compare user password to hashed password.
      bcrypt.compare(password, user.get('password'), function(err, found) {
        if (found) {
          util.createSession(req, res, user);
        }
        else {
          res.redirect('/login');
        }
      });
    }
  });
});

// Logout route.
app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

// Handles catchall routes. Redirects to shortly target site or redirect to homepage if not found.
app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
