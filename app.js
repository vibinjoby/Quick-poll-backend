const express = require("express");
const app = express();
const cors = require("cors");
var bodyParser = require("body-parser");

//routes
const signup = require("./routes/signup");
const signin = require("./routes/login");

//Enabling cors
app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());
app.use("/signup", signup);
app.use("/signin", signin);

app.listen(process.env.PORT || 5000);
