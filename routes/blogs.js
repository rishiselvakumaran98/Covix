var express = require("express");
var router  = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware"); // will automatically take index.js as home file
var { isLoggedIn, checkUserBlog, checkUserComment, isAdmin} = middleware;

// The escapeRegex function is used for search feature to search for blogs
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all BLOG
router.get("/", function(req, res){
  if(req.query.search && req.xhr) { //
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all blogs from DB
      console.log(regex);
      Blog.find({title: regex}, function(err, allBlogs){
         if(err){
            console.log(err);
            req.flash("error", err.message);
         } else {
            res.status(200).json(allBlogs);
         }
      });
  } else {
      // Get all blogs from DB
      Blog.find({}, function(err, allBlogs){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allBlogs);
            } else {
              //res.send("Hello world")
              res.render("blogs/index",{blogs: allBlogs, page: 'blogs'});
            }
         }
      });
  }
});

//CREATE - add new BLOG to DB
router.post("/", isLoggedIn, function(req, res){
    // get data from form and add to BLOG array
    var title = req.body.title;
    var image = req.body.image;
    var description = req.sanitize(req.body.description);
    var topic = req.body.topic;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newBlog = {title: title, image: image, description: description, author: author, topic: topic}
    // Create a new BLOG and save to DB
    Blog.create(newBlog, function(err, newlyCreated){
        if(err){
            console.log(err);
            req.flash("error", err.message);
        } else {
            //redirect back to BLOG page
            req.flash("success", "Success! You have created a new Blog")
            res.redirect("/blogs");
        }
    });
});

router.get("/my-posts", isLoggedIn, function(req, res){
  Blog.find({}, function(err, allBlog){
    if(err){
      req.flash("error", "Sorry, you do not have permission!");
    // }else if(foundBlog.author.id.equals(req.user._id) || req.user.isAdmin){
    //   req.blog = foundBlog;
    } else{
      res.render("blogs/user_posts", {blogs: allBlog, user: req.user});
    }
  }); 
});

//NEW - show form to create new BLOG
router.get("/new", isLoggedIn, function(req, res){
   res.render("blogs/new"); 
});

// SHOW - shows more info about one BLOG
router.get("/:id", function(req, res){
    //find the BLOG with provided ID
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
        if(err || !foundBlog){
            console.log(err);
            req.flash('error', 'Sorry, that blog does not exist!');
            return res.redirect('/blogs');
        } else {
            //render show template with that BLOG
            res.render("blogs/show", {blog: foundBlog});
        }
    });
});



// EDIT BLOG ROUTE
router.get("/:id/edit", isLoggedIn, checkUserBlog, function(req, res){
  res.render("blogs/edit", {blog: req.blog});
    // Blog.findById(req.params.id, function(err, foundBlog){
    //   if(err){
    //     res.redirect("/blogs/:id");
    //   } else{
    //     res.render("blogs/edit", {blog: foundBlog});
    //   }
    // });
});

// UPDATE BLOG ROUTE
router.put("/:id", function(req, res){
    // find and update the correct BLOG
    var newInfo = {title: req.body.title, image: req.body.image, body: req.body.description, topic: topic}
    Blog.findByIdAndUpdate(req.params.id, {$set: newInfo}, function(err, updatedBlog){
       if(err){
           req.flash("error", err.message);
          res.redirect("back");
       } else {
           //redirect somewhere(show page)
           req.flash("success","Successfully Updated Blog!");
           res.redirect("/blogs/" + req.params.id);
       }
    });
});

// DESTROY BLOG ROUTE
router.delete("/:id", isLoggedIn, checkUserBlog, function(req, res){
   Comment.remove({
      _id: {
        $in: req.blog.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.blog.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Blog deleted!');
            res.redirect('/blogs');
          });
      }
    })
});



module.exports = router;
