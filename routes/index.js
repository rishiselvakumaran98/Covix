var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User    = require("../models/user");
var async           = require('async'),
    nodemailer      = require('nodemailer'),
    crypto          = require('crypto'),
    bcrypt          = require('bcrypt-nodejs');
var xoauth2 = require('xoauth2');
//root route
router.get("/", function(req, res){
    res.render("landing");
});

router.get("/about", function(req, res){
   res.render("about", {page: 'about'}); 
});

router.get("/prevention", function(req, res){
   res.render("prevention", {page: 'prevention'}); 
});

router.get("/treatment", function(req, res){
   res.render("treatment", {page: 'treatment'}); 
});

router.get("/latest-news", function(req, res){
   res.render("latest-news", {page: 'latest-news'}); 
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", function(req, res){
   var newUser = new User({name: req.body.name, username: req.body.username, password: req.body.password});
   if(req.body.adminCode === process.env.ADMIN_CODE) {
     newUser.isAdmin = true;
   }
   User.register(newUser, req.body.password, function(err, user){
       if(err){
           console.log(err);
           return res.render("register", {error: err.message});
       }
       passport.authenticate("local")(req, res, function(){
          req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.name);
          res.redirect(req.session.returnTo || '/blogs');
         delete req.session.returnTo; 
       });
   });
 });

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

//handling login logic
router.post('/login', function(req, res, next) {
   passport.authenticate('local',
     {
       failureFlash: true, 
       successFlash: 'Welcome to Covix!'
     }, function(err, user, info) {
     if (err) return next(err)
     if (!user) {
       return res.redirect('/login')
     }
     req.logIn(user, function(err) {
       if (err) return next(err);
       return res.redirect(req.session.returnTo || '/blogs');
     });
   })(req, res, next);
 });

 router.get('/forgot', function(req, res) {
   res.render('forgot', {
     user: req.user
   });
 });
 
 
 router.post('/forgot', function(req, res, next) {
   async.waterfall([
     function(done) {
       crypto.randomBytes(20, function(err, buf) {
         var token = buf.toString('hex');
         done(err, token);
       });
     },
     function(token, done) {
       User.findOne({ username: req.body.username }, function(err, user) {
         if (!user) {
           req.flash('error', 'No account with that email address exists.');
           return res.redirect('/forgot');
         }
 
         user.resetPasswordToken = token;
         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
 
         user.save(function(err) {
           done(err, token, user);
         });
       });
     },
     function(token, user, done) {
       var smtpTransport = nodemailer.createTransport({
         service: 'Gmail',
         auth: {
             user: 'teamcovix@gmail.com',
             pass: 'mgsf nbun pqmk tsvb'
           
         }
       });
       var mailOptions = {
         to: user.username,
         from: 'Covix_team <noreply.teamcovix21@gmail.com>',
         replyTo: 'noreply.teamcovix21@gmail.com',
         subject: 'Password Reset',
         text: 'You are receiving this because you have requested the reset of the password for your account in Covix Website.\n\n' +
           'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           'http://' + req.headers.host + '/reset/' + token + '\n\n' +
           'If you did not request this, please ignore this email and your password will remain unchanged.\n'
       };
       smtpTransport.sendMail(mailOptions, function(err) {
         req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions. Please check your inbox/spam folder for email');
         done(err, 'done');
       });
     }
   ], function(err) {
     if (err) return next(err);
     res.redirect('/forgot');
   });
 });
 
 
 router.get('/reset/:token', function(req, res) {
   User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
     if (!user) {
       req.flash('error', 'Password reset token is invalid or has expired.');
       return res.redirect('/forgot');
     }
     res.render('reset', {
       user: req.user
     });
   });
 });
 
 router.post('/reset/:token', function(req, res) {
   async.waterfall([
     function(done) {
       User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
         if (!user) {
           req.flash('error', 'Password reset token is invalid or has expired.');
           return res.redirect('back');
         }
 
         user.password = req.body.password;
         user.resetPasswordToken = undefined;
         user.resetPasswordExpires = undefined;
 
         user.save(function(err) {
           req.logIn(user, function(err) {
             done(err, user);
           });
         });
       });
     },
     function(user, done) {
       var smtpTransport = nodemailer.createTransport({
         service: 'Gmail',
         auth: {
           user: 'teamcovix@gmail.com',
           pass: 'mgsf nbun pqmk tsvb'
         }
       });
       var mailOptions = {
         to: user.username,
         from: 'passwordreset@teamcovix21.com <noreply.teamcovix21@gmail.com>',
         replyTo: 'noreply.teamcovix21@gmail.com',
         subject: 'Your password has been changed',
         text: 'Hello,\n\n' +
           'This is a confirmation that the password for your account ' + user.username + ' has been changed.\n Thank you for being a member of Covix!'
       };
       smtpTransport.sendMail(mailOptions, function(err) {
         req.flash('success', 'Success! Your password has been changed.');
         done(err);
       });
     }
   ], function(err) {
     res.redirect('/blogs');
   });
 });

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Thanks, See you later!");
   res.redirect("/blogs");
});

module.exports = router;