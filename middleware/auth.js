const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) return res.status(401).send("Access denied. No token provided");
  //process.env.JWT_PRIVATE_KEY
  try {
    const decoded = jwt.verify(token, "gsfGSHshjYakkk");
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err.message);
    res.status(400).send("Invalid token");
  }
};
