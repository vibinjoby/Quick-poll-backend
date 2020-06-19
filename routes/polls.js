const express = require("express");
const auth = require("../middleware/auth");
var jwtDecode = require("jwt-decode");
const router = express.Router();
const db = require("../db/db");

router.get("/viewPublicPolls", auth, (_, res) => {
  db.fetchAllPolls().then(result => {
    res.render("polls", {
      pollquestion: result
    });
  });
});

router.get("/getPollQuestion/:id", auth, (req, res) => {
  const id = req.params.id;
  db.getPollQuestion(id).then(result => res.send(result));
});

router.get("/getMyPolls", auth, (req, res) => {
  const token = req.header("x-auth-token");
  const decodedUserObj = jwtDecode(token);
  db.getUserPolls(decodedUserObj._id).then(result => {
    //For testing added noOfVotes --> once implementation is done will be removed
    res.render("mypolls", { mypolls: result, noOfVotes: "No Votes" });
  });
});

module.exports = router;
