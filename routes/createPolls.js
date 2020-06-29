const express = require("express");
const auth = require("../middleware/auth");
var jwtDecode = require("jwt-decode");
const router = express.Router();
const AWS = require("aws-sdk");
const fs = require("fs");
const db = require("../db/db");

const upload = require("../middleware/fileupload");

// For Image poll
router.post(
  "/imagePoll",
  auth,
  upload.fields([
    {
      name: "question",
      maxCount: 1
    },
    {
      name: "options",
      maxCount: 4
    }
  ]),
  (req, res) => {
    console.log("req.files", req.files);
    try {
      console.log("options", req.params);
    } catch (err) {
      console.log(err);
    }
    if (!req.files || (!req.files.question && !req.files.options))
      return res.status(400).send("No Files sent");
    try {
      const token = req.header("x-auth-token");
      const decodedUserObj = jwtDecode(token);
      const userId = decodedUserObj._id;
      const {
        is_question_image,
        question_text,
        is_options_image,
        options_text,
        is_private
      } = req.body;

      //If question is an image then the options are text
      if (is_question_image && is_question_image.toUpperCase() === "Y") {
        if (!question_text || !options_text) {
          return res
            .status(400)
            .send(
              "question_text/options_text not sent in body when question is an image"
            );
        }
        //If options is an image then the question is text
      } else if (is_options_image && is_options_image.toUpperCase() === "Y") {
        if (!question_text || !options_text) {
          return res
            .status(400)
            .send(
              "question_text/options_text not sent in body when options is an image"
            );
        } else {
          // Check if the number of options images from the request matches the number of options in text
          const options_text_obj = options_text.split(",");

          if (options_text_obj.length !== req.files.options.length) {
            return res
              .status(400)
              .send(
                "number of options in text is not equal to number of options image sent"
              );
          }
        }
      } else {
        return res
          .status(400)
          .send(
            "Incorrect request sent to server..Please provide either is_question_image/is_options_image flag in the request  "
          );
      }

      let fileNames = [];
      let fileDataArr = [];
      let questionsUrl = "";
      let optionsUrl = [];

      is_options_image &&
        req.files.options.map(element => {
          fileNames.push(element.filename);
        });

      if (is_question_image) fileNames.push(req.files.question[0].filename);

      uploadImage(
        userId,
        is_question_image,
        is_options_image,
        fileNames,
        fileDataArr,
        question_text,
        options_text,
        questionsUrl,
        optionsUrl,
        is_private
      );
      res.send("File uploaded successfully!!");
    } catch (err) {
      console.log(err.message);
      res
        .status(500)
        .send(`Something went wrong with the server ${err.message}`);
    }
  }
);

/**
 *
 * Function to upload image to S3 bucket by parsing the image from form-data using multer
 * @param {*} is_question_image
 * @param {*} is_options_image
 * @param {*} filename
 */
const uploadImage = async (
  userId,
  is_question_image,
  is_options_image,
  fileNames,
  fileDataArr,
  question_text,
  options_text,
  questionsUrl,
  optionsUrl,
  is_private
) => {
  AWS.config.update({
    //process.env.AWS_ACCESS_KEY_ID
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //process.env.AWS_SECRET_KEY
    secretAccessKey: process.env.AWS_SECRET_KEY
  });

  //returns one file name and one file data as an array
  await fileNames.map(filename => {
    const data = fs.readFileSync(`./uploads/${filename}`);
    fileDataArr.push({ filename, fileData: data });
  });

  // iterate the file data array and save the url to array options/questions
  const result = await fileDataArr.map(async fileData => {
    const { fileData: data, filename } = fileData;
    const uploadFile = new AWS.S3.ManagedUpload({
      params: {
        Bucket: "onlinepollimages",
        Key: filename,
        ACL: "public-read",
        Body: data
      }
    });

    const { Location: url } = await uploadFile.promise();

    // Delete the file in the local after saving to S3 Bucket
    fs.unlink(`./uploads/${filename}`, (err, data) => {
      if (err) return console.log(err);
      console.log(`File deleted successfully ${filename}`);
    });

    // Add the url to the questions / options variable based on the parameter passed
    if (is_options_image) optionsUrl.push(url);
    if (is_question_image) questionsUrl = url;
  });

  // Once the file is uploaded to AWS-S3 Bucket resolve the promise to see the url values and save it to DB
  Promise.all(result).then(() => {
    if (is_question_image)
      db.addPollQuestionImg(
        userId,
        questionsUrl,
        question_text,
        options_text,
        is_private
      );
    if (is_options_image)
      db.addPollOptionsImg(
        userId,
        optionsUrl,
        question_text,
        options_text,
        is_private
      );
  });
};

// For Text Poll
router.post("/textPoll", auth, (req, res) => {
  try {
    if (!req.body || !req.body.options || !req.body.question)
      return res.status(400).send("Invalid request sent to server");

    const { question, options, is_private } = req.body;
    const token = req.header("x-auth-token");
    const decodedUserObj = jwtDecode(token);
    const userId = decodedUserObj._id;

    //Save the text poll and send the saved object in the collection as response
    db.createTextPoll(userId, question, options, is_private).then(data =>
      res.send(data)
    );
  } catch (err) {
    console.log(err.message);
    res.status(500).send(`Something went wrong in the server ${err.message}`);
  }
});

module.exports = router;
