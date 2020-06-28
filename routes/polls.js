const express = require("express");
const auth = require("../middleware/auth");
var jwtDecode = require("jwt-decode");
const router = express.Router();
const db = require("../db/db");

router.get("/viewPublicPolls", auth, (_, res) => {
  db.fetchAllPolls()
    .then(result => {
      result.length > 0
        ? res.render("polls", {
            pollquestion: result[0]
          })
        : res.render("nopolls");
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong in the server ${err.message}`);
    });
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
      result.length > 0
        ? res.render("mypolls", { mypolls: result[0] })
        : res.render("nopolls");
    })
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

router.delete("/deletePoll/:id", auth, (req, res) => {
  const id = req.params.id;
  db.deletePoll(id)
    .then(result => {
      result.length > 0 && res.send(result);
      result.length == 0 &&
        res.send(
          "No such poll present..Either the poll is deleted or the id is incorrect"
        );
    })
    .catch(err =>
      res.status(500).send(`Something went wrong in the server ${err.message}`)
    );
});

router.post("/vote", auth, (req, res) => {
  if (!req.body || !req.body.pollId || !req.body.optionChosen)
    return res
      .status(400)
      .send(
        "Incorrect request sent to server missing pollId / optionChosen attribute"
      );
  const { pollId, optionChosen } = req.body;
  db.voteForPoll(pollId, optionChosen)
    .then(() => res.send({ message: "Vote registered" }))
    .catch(err => {
      console.log(err);
      res
        .status(500)
        .send(`Something went wrong with the server ${err.message}`);
    });
});

router.get("/viewResult/:id", auth, (req, res) => {
  //call the db and get the no of votes per options
  db.fetchVoteResults(req.params.id)
    .then(result => {
      if (!result) return res.status(400).send("Id not found");
      let finalResult = {};
      const totalVotes = result.no_of_votes;
      const promiseOutput = Promise.all(
        Object.keys(result.votes_per_options).map(options => {
          const votes = result.votes_per_options[options];
          //calculate the percentage of votes per each option and round off
          finalResult[options] =
            votes > 0 ? Math.ceil((votes / totalVotes) * 100) : 0;
          return finalResult;
        })
      );
      promiseOutput.then(data => {
        res.send(data[0]);
      });
    })
    .catch(err => {
      console.log(err);
      res
        .status(500)
        .send(`Something went wrong with the server ${err.message}`);
    });
});

module.exports = router;
