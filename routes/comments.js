const express = require("express");
const router  = express.Router({mergeParams: true});
const Blog = require("../models/blog");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find blog by id
    //console.log(req.params.id);
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {blog: blog});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn,function(req, res){
   //lookup blog using ID
   Blog.findById(req.params.id, function(err, blog){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               blog.comments.push(comment);
               blog.save();
               //console.log(comment);
               req.flash('success', 'You created a comment!');
               res.redirect('/blogs/' + blog._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {blog_id: req.params.id, comment: req.comment});
});

// COMMENT UPDATE
router.put("/:comment_id", isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          req.flash('error', err.message);
          res.redirect("edit");
      } else {
          res.redirect("/blogs/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", isLoggedIn, checkUserComment, function(req, res){
    //findByIdAndRemove
    Blog.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/blogs/" + req.params.id);
        });
    }
  });
});

module.exports = router;