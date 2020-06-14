const app = require("express")();
const cors = require("cors");
const mongo = require("mongoose");

app.use(cors());

const uri =
  "mongodb+srv://admin:admin@cluster0-acs6q.mongodb.net/online_poll?retryWrites=true&w=majority";
mongo
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to mongodb..."))
  .catch(err => console.log("Unable to connnect to mongodb", err));

const usersSchema = new mongo.Schema({
  name: String,
  email: String,
  password: String,
  create_date: Date
});

const Users = mongo.model("Users", usersSchema);

/*
    Check if the username already exists in mongodb
*/
async function checkEmailExists(emailId) {
  const result = await Users.find({
    email: { $regex: emailId, $options: "i" }
  });
  if (result.length > 0) return true;
  return false;
}

app.get("/checkEmail/:email", (req, res) => {
  checkEmailExists(req.params.username).then(result => {
    const response = {
      output: result ? "Username already exists" : "Username doesnt exist"
    };
    res.send(response);
  });
});

app.listen(8080);
