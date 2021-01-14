var Blog = require("../models/blog");
var Comment = require("../models/comment");

// all the middleware exports goes here
module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){ //built in function to check if user is logged in
          return next();
      }
      res.redirect("/login");
  },

  checkUserBlog: function(req, res, next) {
    Blog.findById(req.params.id, function(err, foundBlog){
       if(err || !foundBlog){
          req.flash('error', 'Sorry, that blog does not exist!');
           res.redirect("back");
           // does user own the Blog?
        }else if(foundBlog.author.id.equals(req.user._id) || req.user.isAdmin) {
           req.blog = foundBlog;
           next();
         }else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect("/blogs/" + req.params.id);
        }
       
    });
  },

  checkUserComment: function(req, res, next) {
    Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err || !foundComment){
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect("back");
       }  else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/blogs/' + req.params.id);
       }
    });
  },

  isAdmin: function(req, res, next) {
    if(req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to the spams and trolls.');
      res.redirect('back');
    }
  }
}; 
