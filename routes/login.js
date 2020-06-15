const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", (req, res) => {
  console.log(req.body);
  const { emailId, password } = req.body;
  db.validateForSignIn(emailId, password).then(username => {
    const response = {
      username
    };
    console.log(response);
    res.send(response);
  });
});

module.exports = router;
