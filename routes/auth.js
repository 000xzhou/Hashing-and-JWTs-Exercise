const express = require("express");
const User = require("../models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await User.authenticate(username, password);
    let token = jwt.sign({ username }, process.env.SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token: token });
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
    const result = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });
    let token = jwt.sign({ username }, process.env.SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token: token });
  } catch (err) {
    if (err.code === "23505") {
      return next(new ExpressError(`Username already exist`, 400));
    }
    return next(err);
  }
});

module.exports = router;
