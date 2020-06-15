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
  res.send({ output: "Account created successfully!!" });
  db.createNewAccount(req.body);
});

module.exports = router;
