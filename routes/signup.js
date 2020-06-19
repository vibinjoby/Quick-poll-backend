const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/checkEmail/:email", (req, res) => {
  db.checkEmailExists(req.params.email).then(result => {
    const response = {
      output: result ? "Email already exists" : "Email doesnt exist"
    };
    res.send(response);
  });
});

router.post("/createAccount", (req, res) => {
  try {
    db.createNewAccount(req.body).then(() => {
      res.send({ output: "Account created successfully!!" });
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Something went wrong in the server");
  }
});

module.exports = router;
