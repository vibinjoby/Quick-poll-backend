const express = require("express");
const app = express();
const cors = require("cors");
var bodyParser = require("body-parser");
//routes
const signup = require("./routes/signup");
const signin = require("./routes/login");
const polls = require("./routes/polls");
const createPolls = require("./routes/createPolls");

//templating engine
app.set("view engine", "pug");
app.set("views", "./views");

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
app.use("/polls", polls);
app.use("/create-polls", createPolls);

app.listen(process.env.PORT || 5000);
