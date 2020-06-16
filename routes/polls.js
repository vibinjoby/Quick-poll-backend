const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/viewPublicPolls", (_, res) => {
  db.fetchAllPolls().then(result => {
    res.render("polls", {
      noOfPolls: result.length,
      pollquestion: result
    });
  });
});

router.get("/getPollQuestion/:id", (req, res) => {
  const id = req.params.id;
  db.getPollQuestion(id).then(result => res.send(result));
});

module.exports = router;
