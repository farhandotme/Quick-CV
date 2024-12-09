const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const connectionDb = require("./DB/connectionDb");
connectionDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Quick CV application listening on port ${port}`);
});
