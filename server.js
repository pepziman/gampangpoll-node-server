// server.js

// set up ======================================================================
// get all the tools we need
var express  	= require('express');
var app      	= express();
var server 		= require('http').Server(app);
var io 		 	     = require('socket.io')(server);
var nodemailer 	 = require('nodemailer');
var port     	= process.env.PORT || 11010;
var mongoose 	= require('mongoose');
var passport 	= require('passport');
var flash    	= require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var MongoStore 	 = require('connect-mongo')(session);

var polling 	       = require('./models/polling');
var User 		         = require('./models/user');
var Live             = require('./models/live');

var answer 		       = require('./models/polling');
var shortid 	       = require('shortid');
var bcrypt   	       = require('bcrypt-nodejs');
//var passportSocketIo = require("passport.socketio");

// configuration ===============================================================
mongoose.connect('mongodb://localhost/gampangpoll'); // connect to our database
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(express.static('public'));
app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
var sessionStore = new MongoStore({
	url: "mongodb://localhost/gampangpoll"
});

var sessionObject = session({
	key	  : 'express.sid',
	secret: 'gampangpoll',
	store : sessionStore
}); // session secret

app.use(sessionObject);
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//==================== NODEMAILER =============================
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'albert.leo93@gmail.com',
        pass: 'wongpinter'
    }
});

// routes ======================================================================
//require('./routes/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


// =====================================
// HOME PAGE (with login links) ========
// =====================================
app.get('/', function(req, res) {
  polling.find({ }, function(err, poll){
    User.find({ }, function(err, user){
      res.render('index.ejs',{
          "poll"  : poll,
           user : req.user
      });
    });
  });
});

app.get('/masuk', function(req, res){
        res.render('masuk.ejs',{ message: req.flash('loginMessage') });
});

app.post('/masuk', function(req, res){
    email = req.body.email;
    pass = req.body.password;
    if(email == "gpars@pisa.com" && pass == "3991"){
      		res.redirect('admin');
    } else res.redirect('back');
});

app.get('/admin', function(req, res){
	polling.find({}, function(err, poll){
	    User.find({}, function(err,user){
	    	res.render('admin',{
	    		"user": user,
				  "poll": poll	
	    	});
		});
	});
});

app.get('/admin/user/edit/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, user){
		res.render('edit_user',{
			"user": user
		});
	});
});

app.get('/admin/user/delete/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, user){
		if(!err){
			user.remove(function(err,poll){
					if(!err){
						res.redirect('/admin');
					} else {
						res.redirect('back');
					}	
			});
		} else {
			res.redirect('back');
		}	
	});
});

app.post('/admin/user/save/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, user){
			//user.name = req.body.nama;
			user.local.email = req.body.email;
			user.local.name = req.body.localname;
			
			user.save(function(err,user){
				if(!err){
					res.redirect('/admin');
				} else {
					res.redirect('back');
				}	
			});
	});
});

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') }); 
});

// process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/dashboard', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.post('/loginhp', passport.authenticate('local-login', {
    successRedirect : '/list', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/list', function(req, res){
    polling.find({}, function(err, poll) {
      res.json(poll);
    });
});

app.get('/dashboard', isLoggedIn, function(req, res){
    res.render('dashboard',{
        user : req.user
    });
});


// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
app.get('/signup', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/dashboard', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.get('/dashboard', isLoggedIn, function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('dashboard.ejs', { 
        user : req.user // get the user out of session and pass to template     
    }); 
});

// =====================================
// PROFILE SECTION =====================
// =====================================
app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
        user : req.user // get the user out of session and pass to template
    });
});


// =====================================
// FACEBOOK ROUTES =====================
// =====================================
// route for facebook authentication and login
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/dashboard',
        failureRedirect : '/'
}));

// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

/*app.get('/json/users', function(req, res){
  user.find({}, function(err, users) {
  	var obj = JSON.stringify(users, null, 4);
    res.send(obj);
  });
});

app.get('/json/users/:user_id', function(req, res){
  user.findById(req.params.user_id, function(err, users) {
  	var obj = JSON.stringify(users, null, 4);
    res.write(obj);
  });
});

app.get('/json/polls', function(req, res){
  polling.find({}, function(err, poll) {
    var obj = JSON.stringify(poll, null, 4);
    res.write(obj);
  });
});

app.get('/json/polls/:poll_id', function(req, res){
  polling.findById(req.params.poll_id, function(err, poll) {
    var obj = JSON.stringify(poll, null, 4);
    res.write(obj);
  });
});

app.post('/authenticate', function(req, email, password, res) {

  // find the user
  User.findOne({
    email: req.body.email
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.validPassword(password) != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
});*/

// =====================================
// TWITTER ROUTES ======================
// =====================================
// route for twitter authentication and login
app.get('/auth/twitter', passport.authenticate('twitter'));

// handle the callback after twitter has authenticated the user
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect : '/dashboard',
        failureRedirect : '/'
}));

// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/dashboard',
        failureRedirect : '/'
}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

// locally --------------------------------
    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

// facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
    }));

// twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
    }));


// google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
           res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
           res.redirect('/profile');
        });
    });
    
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
	    return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

//==================================== POLL ROUTER ==================================================

//require('./routes/poll.js')(app);
app.post('/dashboard/create', isLoggedIn, function(req, res){
  var jawaban = []; //untuk nampung pilihan jawaban dari form
  var pertanyaan = []; //untuk nampung soal dari form
  var poll = new polling(); //create new poll instance dari schema
  var live = new Live();
  var soaloption = [];
  if(req.body.options){ //jika di request BODY yang dikirim dari form terdapat options, maka
    req.body.options.forEach(function(option){ //
      if(option.length){
        //push pilihan jawaban dari form ke array jawaban
        jawaban.push({ title: option});
      }
    });
  }
  if(req.body.soaloption){ 
    req.body.soaloption.forEach(function(option){ 
      if(option.length){
        soaloption.push({ title: option});
      }
    });
  }
  if(req.body.options && jawaban.length >= 2){
    if(req.body.soal){
      req.body.soal.forEach(function(soal){
        //push soal dari form ke array pertanyaan
        if(soal.length) pertanyaan.push({ title: soal});
      });
    }
    
    if(req.body.soal && pertanyaan.length >= 1){
      poll.soal = pertanyaan;
      var list_jawaban = [];
      var indexSoal;
    }

    for (i=0; i<poll.soal.length; i++){
      list_jawaban[i] = [];
    }

    for(i=0; i<jawaban.length; i++){
      indexSoal = soaloption[i].title-1;
      var jwb = new answer();
      jwb.title = jawaban[i].title;
      list_jawaban[indexSoal].push(jwb);
      
    }

    for(i=0;i<poll.soal.length;i++){
      poll.soal[i].jawaban = list_jawaban[i];
    }

    poll.title = req.body.title; 
    //poll.creator = req.user.name;
    poll.creator = req.user.id_user;
    poll.timer = req.body.timer;
    poll.allowMultiple = req.body.jenisopsi;
    //poll.sifat = req.body.jenispolling;
    var s_id = shortid.generate();
    poll.id_poll = s_id;
    
    if(req.body.invbyemail){
      
      var mailOptions = {
          from: '<albert.leo93@gmail.com>', // sender address
          to: req.body.invbyemail, // list of receivers
          subject: 'GampangPoll Invitation', // Subject line
          text: 'Selamat Anda telah diundang oleh '+req.user.name+', silahkan copy id polling berikut : '+s_id, // plaintext body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info){
          if(error){
              return console.log(error);
          }
          console.log('Message sent: ' + info.response);
      });

    }

    poll.result = req.body.chart; // 1 = bar 2 = column 3 = pie 
    
    live.status = "offline";
    live.poll_id = poll.id_poll;
    live.save();
    // Save the instance to the db
    
    console.log("save");
    console.log(poll);
    poll.save( function(err, poll){
      if(!err){
        res.redirect('/mypolling/'+poll._id);
      } else {
        console.log("error: "+err);
        res.redirect('back');
      }
    });
  }
    
  else res.redirect('back');
});

// =============================================================
// MY Polling SECTION ==========================================
// =============================================================
app.get('/mypolling', isLoggedIn, function(req, res) {
		polling.find({'creator': req.user.id_user}, function(err, poll) {
	        if (!err) {
              console.log(req.user.id_user);
	            res.render('mypolling.ejs',{
	                "poll" : poll,
                  user : req.user
	            });
	        } else {
	          res.writeHead(200, {
	            'Content-Type': 'text/html'
	          });
	          res.write(template.build("Oh dear", "Database error", "<p>Error details: " + err + "</p>"));
	          res.end();
	        }
	    });
});

app.get('/mypolling/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(err || !poll){
			res.redirect('back');
		} else {
			res.render('view', {
				"poll" : poll,
				"user" : req.user
			});
		}
	});
});



/*app.get('/view', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(err || !poll){
			res.redirect('back');
		} else {
			res.render('view', {
				"poll" : poll,
				"user" : req.user
			});
		}
	});
});*/

app.get('/mypolling/edit/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(err || !poll){
			res.redirect('back');
		} else {
			res.render('edit', {
				"poll" : poll,
				"user" : req.user
			});
		}
	});
});

app.get('/mypolling/delete/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(!err){
			poll.remove(function(err,poll){
					if(!err){
						res.redirect('/mypolling/');
					} else {
						res.redirect('back');
					}	
			});
		} else {
			res.redirect('back');
		}	
	});
});

app.get('/view/delete/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll, soal){
		if(!err){
			poll.soal.remove(function(err,poll){
					if(!err){
						res.redirect('/mypolling/');
					} else {
						res.redirect('back');
					}	
			});
		} else {
			res.redirect('back');
		}	
	});
});

// =============================== EDIT =================================================
app.post('/edit/save/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		var jawaban = []; //untuk nampung pilihan jawaban dari form
		var pertanyaan = []; //untuk nampung soal dari form
		
		var soaloption = [];
		if(req.body.options){ //jika di request BODY yang dikirim dari form terdapat options, maka
			req.body.options.forEach(function(option){ //
				if(option.length){
					console.log("isi option "+option);
					//push pilihan jawaban dari form ke array jawaban
					jawaban.push({ title: option});
					
				}
			});
		}
		if(req.body.soaloption){ //jika di request BODY yang dikirim dari form terdapat options, maka
			req.body.soaloption.forEach(function(option){ //
				if(option.length){
					console.log("isi option "+option);
					//push pilihan jawaban dari form ke array jawaban
					soaloption.push({ title: option});
					console.log("isi soalopt"+soaloption);
				}
			});
		}
		if(req.body.options && jawaban.length >= 2){
			if(req.body.soal){
				req.body.soal.forEach(function(soal){
					//push data soal dari form ke array pertanyaan
					if(soal.length) pertanyaan.push({ title: soal});
				});
			}
			if(req.body.soal && pertanyaan.length >= 1){
				
				poll.title = req.body.title; // push title dari form ke field title di instance poll
				poll.soal = pertanyaan;
				var list_jawaban = [];
				var indexSoal;
			}

			for (i=0; i<poll.soal.length; i++){
				list_jawaban[i] = [];
			}

			for(i=0; i<jawaban.length; i++){
				indexSoal = soaloption[i].title-1;
				var jwb = new answer();
				jwb.title = jawaban[i].title;

				list_jawaban[indexSoal].push(jwb);
				console.log("isi jawaban: "+jawaban[i].title);
			}

			for(i=0;i<poll.soal.length;i++){
				//for(j=0;j<list_jawaban.length;i++){
				poll.soal[i].jawaban = list_jawaban[i];
			}
			console.log("isi pertanyaan: "+poll.soal);
			
			poll.creator = req.body.user_id;
			
			// Save the instance to the db
			
			poll.save( function(err, poll){
				if(!err){
					res.redirect('/mypolling/'+poll._id);
				} else {
					res.redirect('back');
				}
			});
		}
			
		else res.redirect('back');
	});
});

// =================== VOTES ========================
app.get('/jawab', isLoggedIn ,function(req, res){
	polling.find({ }, function(err, poll){
		res.render('daftar_poll',{
			"poll" : poll,
			 user  : req.user
		});
	});
});

app.get('/votes/:poll_id', function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		res.render('votes',{
			"poll" : poll,
			user: req.user
		});
	});
});

app.get('/operator/:poll_id/:session_key', function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
  Live.find({'poll_id': req.params.poll_id,'session_key':req.params.session_key}, function(err, live){
		res.render('operator',{
			"poll": poll	
		});
	});
  });
});

app.get('/graph/:poll_id', function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		res.render('chart',{
			"poll": poll
		});
	});
});

app.get('/allpolling/edit/:poll_id', function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(!err){
			res.render('edit_poll', {
				"poll": poll,
			});
		}
	});
});

app.get('/allpolling/delete/:poll_id', function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(!err){
			poll.remove(function(err, poll){
				if(!err){
					res.redirect('/admin');
				} else {
					res.redirect('back');
				}	
			});
		} else {
			res.redirect('back');
		}	
	});
});

app.post('/showchart/:poll_id',function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		if(!err){
			var data = JSON.stringify(poll, null, 4);
		    res.send(data);
			
		}
	});
});

app.post('/admin/edit/save/:poll_id', isLoggedIn, function(req, res){
	polling.findById(req.params.poll_id, function(err, poll){
		var jawaban = []; //untuk nampung pilihan jawaban dari form
		var pertanyaan = []; //untuk nampung soal dari form
		
		var soaloption = [];
		if(req.body.options){ //jika di request BODY yang dikirim dari form terdapat options, maka
			req.body.options.forEach(function(option){ //
				if(option.length){
					
					//push pilihan jawaban dari form ke array jawaban
					jawaban.push({ title: option});
					
				}
			});
		}
		if(req.body.soaloption){ //jika di request BODY yang dikirim dari form terdapat options, maka
			req.body.soaloption.forEach(function(option){ //
				if(option.length){
					
					//push pilihan jawaban dari form ke array jawaban
					soaloption.push({ title: option});
					
				}
			});
		}
		if(req.body.options && jawaban.length >= 2){
			if(req.body.soal){
				req.body.soal.forEach(function(soal){
					//push data soal dari form ke array pertanyaan
					if(soal.length) pertanyaan.push({ title: soal});
				});
			}
			if(req.body.soal && pertanyaan.length >= 1){
				
				poll.title = req.body.title; // push title dari form ke field title di instance poll
				poll.soal = pertanyaan;
				var list_jawaban = [];
				var indexSoal;
			}

			for (i=0; i<poll.soal.length; i++){
				list_jawaban[i] = [];
			}

			for(i=0; i<jawaban.length; i++){
				indexSoal = soaloption[i].title-1;
				var jwb = new answer();
				jwb.title = jawaban[i].title;

				list_jawaban[indexSoal].push(jwb);
				
			}

			for(i=0;i<poll.soal.length;i++){
				//for(j=0;j<list_jawaban.length;i++){
				poll.soal[i].jawaban = list_jawaban[i];
			}
			
			
			poll.creator = req.user.id_user;
			
			// Save the instance to the db
			
			poll.save( function(err, poll){
				if(!err){
					res.redirect('/mypolling/'+poll._id);
				} else {
					res.redirect('back');
				}
			});
		}
			
		else res.redirect('back');
	});
});

//var checking = require('./models/polling');
//var cek = new checking();

app.get('/mypolling/open/:poll_id', isLoggedIn, function(req, res){
  polling.findById(req.params.poll_id, function(err, poll){
    Live.find({'poll_id': req.params.poll_id}, function(err, live){

      if(!live.session_key){
        live = new Live();
        console.log("null");
        var session_key = Math.floor(Math.random() * 90000) + 10000;
        live.status = "online";
        live.session_key = session_key;
        live.poll_id = req.params.poll_id;
        console.log(live);
        live.save(function(err, live){
            res.render('waiting_room', {
            "poll": poll,
            user: req.user,
            "key": session_key
          });
        });
        
      } else {
        console.log(session_key);
        res.render('waiting_room', {
          "poll": poll,
          user: req.user,
          "key": session_key
        });
      }
    });
  });
});

// ===================== SOCKET.IO =======================

io.on('connection', function(socket){
	
	socket.emit('text', 'dashboard connected'); //dashboard
	
	//Sign In Event Listener
  socket.on('signin', function(dataform){
		User.findOne({ 'local.email': dataform.email}, function(err, user){
			console.log(user);
			if(user){
				if (!user.validPassword(dataform.pass)){

					console.log("error not valid pass");
					socket.emit('login gagal');
				}
				else
				{

					console.log("valid");
					socket.emit('login sukses',{
						"user": user
					});	
				}
			} else 
			{
				console.log("error");
				socket.emit('login gagal');
			}
		});
	});

  //Sign Up Event Listener
	socket.on('signup', function(dataform){
		User.findOne({'local.email': dataform.email}, function(err, user) {
      
        if (err)
        {
        	return err;
        }
        if(user){
        	socket.emit('user exist');
        }
        else {
            // create the user
            var newUser            = new User();
            newUser.id_user        = shortid.generate();
            newUser.local.email    = dataform.email;
            newUser.local.password = newUser.generateHash(dataform.pass);
            newUser.save(function(err, newUser) {
              
                if (err){
                  console.log(newUser);
                    throw err;
                }
                else{
                  
                	console.log("valid");
      						socket.emit('signup sukses',{
      							"user": newUser
      						});	
                }
            });
        }

    });
	});

	socket.emit('admin','admin connected');
  
	/*polling.find({'sifat': 1}, function(err, poll){
		
		var poll2 = [];
		for(i=0; i<poll.length; i++){
			pid = poll[i]._id;
			//cek ke table sudah baca

			//jika belum ada -> insert ke
		}

		if(!err){socket.emit('event', {evt: poll});}
		else return err;
	});*/

	socket.on('cari', function(id){
			
		polling.findOne({'id_poll': id}, function(err, poll){
			
			socket.emit('data polling search', {isi: poll});
		});
	});

	socket.on('started id polling', function(id){
		
		polling.findById(id, function(err, poll){
			
			socket.broadcast.emit('in client', {data: poll});
		});
	});


	socket.on('kirim vote', function(data){
		polling.findById(data.id_poll, function(err, poll){
		poll.soal[data.indeks_soal].jawaban[data.indeks_jawaban].votes += 1;
		poll.save();

		//untuk cek data user pernah vote / tidak
		/*checking.find({'id_user': data.id_user, 'p_id': data.id_poll}, function(err, cek){
			if(!null){
				cek.p_id = data.id_poll;
				cek.id_user = data.id_user;
				cek.save();
				polling.findById(data.id_poll, function(err, poll){
				  poll.soal[data.indeks_soal].jawaban[data.indeks_jawaban].votes += 1;
				  poll.save();
        });
			}
		});*/
    });
		//console.log(hasil);
		
	});

  //Change Slide Event Listener
	socket.on('change slide', function(data){
		//ambil pol ke indeks_soal
		
		polling.findById(data.id_poll, function(err, poll){
			data_vote = [];
			for(i=0; i<poll.soal[data.indeks_soal].jawaban.length; i++){
				data_vote[i] = poll.soal[data.indeks_soal].jawaban[i].votes;
			}
      //broadcast emitter ke semua socket listener dengan event client change
			socket.broadcast.emit('client change',{'indeks_soal': data.indeks_soal , 'data_vote': data_vote});
			
			
		});
		
	});
});

// launch ================================================

//app.listen(port);
server.listen(port);
console.log('gampangpoll is now running on port ' + port);