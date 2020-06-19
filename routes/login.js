const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../db/db");

router.post("/", (req, res) => {
  const { emailId, password } = req.body;
  db.validateForSignIn(emailId, password).then(response => {
    if (!response) {
      res.status(400).send("Incorrect Username/ password");
      return;
    }
    //process.env.JWT_PRIVATE_KEY
    const token = jwt.sign(response, "gsfGSHshjYakkk");
    res.send(token);
  });
});

module.exports = router;
