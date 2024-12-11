const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
const userModel = require("./models/userModel");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
dotenv.config();

const connectionDb = require("./DB/connectionDb");
connectionDb();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

// GET LOGIN
app.get("/login", (req, res) => {
  res.render("login");
});

// POST LOGIN
app.post("/user-login", async (req, res) => {
  let { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials" });
    }
    res.cookie("userId", user._id);

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error logging in" });
  }
});

// POST REGISTER
app.post("/user-register", async (req, res) => {
  let { name, email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).send({ message: "Email already in use" });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newUser = await userModel.create({
      name,
      email,
      password: hash,
    });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error creating user" });
  }
});
// GET REGISTER
app.get("/register", (req, res) => {
  res.render("registerPage");
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(
    `Quick CV application listening on port http://localhost:${port}`
  );
});
