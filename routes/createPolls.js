const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");
const router = express.Router();
const AWS = require("aws-sdk");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname.split(".")[0] +
        Date.now() +
        "." +
        file.originalname.split(".")[1]
    );
  }
});

const upload = multer({ storage });

router.post(
  "/imagePoll",
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
    uploadImage(req.files.question[0].filename);
    res.send("File uploaded auccessfully!!");
  }
);

function uploadImage(filename) {
  AWS.config.update({
    //process.env.AWS_ACCESS_KEY_ID
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //process.env.AWS_SECRET_KEY
    secretAccessKey: process.env.AWS_SECRET_KEY
  });

  fs.readFile(`./uploads/${filename}`, async (err, data) => {
    var upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: "onlinepollimages",
        Key: filename,
        ACL: "public-read",
        Body: data
      }
    });

    const { Location } = await upload.promise();
    console.log(Location);

    //Delete the file in the local

    fs.unlink(`./uploads/${filename}`, err => {
      if (err) throw err;
      console.log(`successfully deleted ./uploads/${filename}`);
    });
  });
}

module.exports = router;
