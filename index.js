var express = require("express");
var mysql = require("mysql");
let ejs = require("ejs");
const sqlite3 = require("sqlite3").verbose();

var app = express();
var databaseInfo = [];
const bodyParser = require("body-parser");

const sqlstatement = `SELECT * from users`;
// open database in memory
var db = new sqlite3.Database("./db/user.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to user.db");
});

function refreshDB() {
  db.all(sqlstatement, [], (err, rows) => {
    databaseInfo = [];
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      databaseInfo.push({
        name: row.first_name + " " + row.last_name,
        email: row.email,
        userID: row.id,
      });
    });
  });
}

refreshDB();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

/* GET home page. */
app.get("/", function (req, res, next) {
  refreshDB();
  res.render("index", {
    users: databaseInfo,
    deleted: false,
    newItem: false,
  });
});
var savedEmail = "";

app.post("/newItem", function (req, res, next) {
  db.run(
    `INSERT INTO users(first_name, last_name, email) VALUES(?, ? ,?)`,
    [req.body.first_name, req.body.last_name, req.body.email],
    function (err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    }
  );
  refreshDB();
  res.render("index", {
    users: databaseInfo,
    deleted: false,
    newItem: true,
  });
});

app.get("/edit/:email", function (req, res, next) {
  res.render("update", { userData: databaseInfo });
  savedEmail = req.params.email;
});

app.post("/edit", function (req, res) {
  refreshDB();
  db.run(
    `UPDATE users SET email = ? where email = ?`,
    [req.body.newEmail, savedEmail],
    function (err) {
      if (err) throw err;
    }
  );

  res.render("index", {
    users: databaseInfo,
    deleted: false,
    newItem: false,
  });
});

app.get("/delete/:userID", function (req, res) {
  db.run(`DELETE FROM users WHERE id=?`, req.params.userID, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Row(s) deleted ${this.changes}`);
  });
  refreshDB();
  res.render("index", {
    users: databaseInfo,
    deleted: true,
    newItem: false,
  });
});

app.listen(4000, () => console.log("Listening on port 4000"));
