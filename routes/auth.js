const express = require("express");
const User = require("../models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await User.authenticate(username, password);
    let token = jwt.sign({ result }, process.env.SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json(token);
  } catch (err) {
    return next(err);
  }
});
/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    const result = await User.register(
      username,
      password,
      first_name,
      last_name,
      phone
    );
    let token = jwt.sign({ result }, process.env.SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json(token);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
