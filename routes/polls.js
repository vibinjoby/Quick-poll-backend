const express = require("express");
const auth = require("../middleware/auth");
var jwtDecode = require("jwt-decode");
const router = express.Router();
const db = require("../db/db");

router.get("/viewPublicPolls", auth, (_, res) => {
  db.fetchAllPolls()
    .then(result => {
      res.render("polls", {
        pollquestion: result
      });
    })
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

router.get("/getPollQuestion/:id", auth, (req, res) => {
  const id = req.params.id;
  db.getPollQuestion(id)
    .then(result => res.send(result))
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

router.get("/getMyPolls", auth, (req, res) => {
  const token = req.header("x-auth-token");
  const decodedUserObj = jwtDecode(token);
  db.getUserPolls(decodedUserObj._id)
    .then(result => {
      //For testing added noOfVotes --> once implementation is done will be removed
      result.length > 0
        ? res.render("mypolls", { mypolls: result, noOfVotes: "No Votes" })
        : res.render("nopolls");
    })
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

router.delete("/deletePoll/:id", auth, (req, res) => {
  const id = req.params.id;
  db.deletePoll(id)
    .then(result => res.send(result))
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

module.exports = router;
