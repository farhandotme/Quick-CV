const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
const userModel = require("./models/userModel");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const isLoggedin = require("./utils/isLoggedin");
const jwt = require("jsonwebtoken");
dotenv.config();

const connectionDb = require("./DB/connectionDb");
connectionDb();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

app.get("/", isLoggedin, (req, res) => {
  res.render("index");
});

// GET LOGIN
app.get("/login", (req, res) => {
  const successMsg = req.flash("success_msg");
  const loginError = req.flash("login-error");
  res.render("login", { loginError, successMsg });
});

// POST LOGIN
app.post("/user-login", async (req, res) => {
  let { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    req.flash("login-error", "Email not found");
    res.redirect("/login");
  } else {
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        req.session.user = user;
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });
        res.cookie("token", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
          httpOnly: true,
        });

        return res.redirect("/");
      } else {
        req.flash("login-error", "Incorrect Password");
        res.redirect("/login");
      }
    });
  }
});

// POST REGISTER
app.post("/user-register", async (req, res) => {
  let { name, email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      req.flash("register-error", "Email already exists");
      return res.redirect("/register");
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newUser = await userModel.create({
      name,
      email,
      password: hash,
    });
    req.flash("success_msg", "User created successfully");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error creating user" });
  }
});
// GET REGISTER
app.get("/register", (req, res) => {
  const registerError = req.flash("register-error");
  res.render("registerPage", { registerError });
});

// GET LOGOUT
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

//RESUME PAGE
app.get("/resume", isLoggedin, (req, res) => {
  res.render("resume");
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(
    `Quick CV application listening on port http://localhost:${port}`
  );
});
