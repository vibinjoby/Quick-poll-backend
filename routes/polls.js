const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/viewPublicPolls", (_, res) => {
  db.fetchAllPolls().then(result => {
    res.render("polls", {
      pollquestion: result
    });
  });
});

router.get("/getPollQuestion/:id", (req, res) => {
  const id = req.params.id;
  db.getPollQuestion(id).then(result => res.send(result));
});

router.get("/getMyPolls/:userId", (req, res) => {
  db.getUserPolls(req.params.userId).then(result => {
    res.render("mypolls", { mypolls: result });
  });
});

module.exports = router;
