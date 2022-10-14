const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const saltRounds = 10;
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: 'Our Little Secret.',
  resave: false,
  saveUninitialized: true
}))

app.use(function(req,res,next){
  res.locals.currentUser = req.user;
  next();
})

app.use(passport.initialize());
app.use(passport.session());

var currentUser = "";

// mongoose.connect("mongodb://localhost:27017/blogDB",function(err){
mongoose.connect("mongodb+srv://admin-kashika:kashika773@cluster0.c7yvvhj.mongodb.net/blogDB",function(err){
  if(err)
    console.log(err);
  else {
    console.log("Connected!")
  }
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String
});

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  username:String,
  password:String
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});



app.get("/", function(req, res){

  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts,
        isLoggedIn:true
        });
    });
  }
  else{
    res.render("home", {
      startingContent: homeStartingContent,
      posts: [],
      isLoggedIn:false
      });
  }
})

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
      res.render("compose",{isLoggedIn:true});
  }
  else{
    res.redirect("/login");
  }
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author:currentUser.username
  })

  post.save(function(err){
    if(err)
      console.log(err);
    else{
      res.redirect("/");
    }
  });
});

app.get("/about", function(req, res){

  if(req.isAuthenticated()){
      res.render("about", {aboutContent: aboutContent,isLoggedIn:true});
  }
  else{
  res.render("about", {aboutContent: aboutContent,isLoggedIn:false});
  }
});

app.get("/contact", function(req, res){

  if(req.isAuthenticated()){
      res.render("contact", {contactContent: contactContent,isLoggedIn:true});
  }
  else{
    res.render("contact", {contactContent: contactContent,isLoggedIn:false});
  }

});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      id:post._id,
      title: post.title,
      content: post.content,
      author:post.author,
      isLoggedIn:true
    });
  });
})

app.get("/login",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/logout");
  }

  else{
    res.render("login",{isLoggedIn:false});
  }
})

app.post("/login",function(req,res){

  const currentUsername = req.body.username;
  const currentPassword =  req.body.password;

  const user = new User({
    username: currentUsername,
    password: currentPassword
  })

  req.login(user,function(err){
    if(err)
      console.log(err);
    else {
      passport.authenticate("local")(req,res,function(){
        currentUser = req.user;
        res.redirect("/");
      })
    }
  })
})

app.get("/register",function(req,res){
  res.render("register",{isLoggedIn:false});
})

app.post("/register",function(req,res){

  User.register({username:req.body.username},req.body.password,function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        currentUser = req.user;
        res.redirect("/");
      })
    }
  })
})

app.get("/logout",function(req,res){
  req.logout(function(err){
    if(err)
      console.log(err);
    else {
      res.redirect("/");
    }
  });

})

app.get("/posts/delete/:post_id",function(req,res){
  let userId = req.params.post_id;

  Post.findOne({_id:userId},function(err,post){
    if(err)
      console.log(err);
    else{
      if(post.author == currentUser.username){
        Post.deleteOne({_id:userId},function(err){
          if(err)
            console.log(err);
          else {
            res.redirect("/");
          }
        })
      }
      else {
        res.send("Not authorized to delete this post!");
      }
    }
  })
})

app.post("/delete",function(req,res){
  console.log(req.body.user_id);
  // let userId = req.body.user_id;
  //
  // Post.findOne({_id:userId},function(err,post){
  //   if(err)
  //     console.log(err);
  //   else{
  //     if(post.author == currentUser.username){
  //       Post.deleteOne({_id:userId},function(err){
  //         if(err)
  //           console.log(err);
  //         else {
  //           res.redirect("/");
  //         }
  //       })
  //     }
  //     else {
  //       res.send("Not authorized to delete this post!");
  //     }
  //   }
  // })


})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
