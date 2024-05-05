/** User class for message.ly */
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
/** User of the site. */
class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_WORK_FACTOR)
    );
    const currentTimestamp = new Date();
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING username, password, first_name, last_name, phone`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        phone,
        currentTimestamp,
        currentTimestamp,
      ]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      "SELECT password FROM users WHERE username = $1",
      [username]
    );
    let userResult = result.rows[0];
    if (userResult) {
      if ((await bcrypt.compare(password, userResult.password)) === true) {
        let token = jwt.sign({ username }, process.env.SECRET_KEY);
        return { token };
      }
    } else {
      throw new ExpressError("Invalid user/password", 400);
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const currentTimestamp = new Date();
    const result = await db.query(
      `UPDATE users 
       SET last_login_at = $1
       WHERE username = $2`,
      [currentTimestamp, username]
    );
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `
    SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
    WHERE username=$1
    `,
      [username]
    );
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    // can get messages from user

    const results = await db.query(
      `
    SELECT t.username, t.first_name, t.last_name, t.phone,
    m.id, m.sent_at, m.read_at, m.body
    FROM users as u
    JOIN messages as m ON u.username = m.from_username
    JOIN users AS t ON m.to_username = t.username
    WHERE u.username = $1
    `,
      [username]
    );

    if (!results.rows.length === 0) {
      throw new ExpressError(`No message from user: ${id}`, 404);
    }

    return results.rows.map((row) => ({
      id: row.id,
      sent_at: row.sent_at,
      read_at: row.read_at,
      body: row.body,
      to_user: {
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
      },
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    // can get messages to user

    const results = await db.query(
      `
    SELECT t.username, t.first_name, t.last_name, t.phone,
    m.id, m.sent_at, m.read_at, m.body
    FROM users as u
    JOIN messages as m ON u.username = m.to_username
    JOIN users AS t ON m.from_username = t.username
    WHERE u.username = $1
    `,
      [username]
    );

    if (!results.rows.length === 0) {
      throw new ExpressError(`No message from user: ${id}`, 404);
    }

    return results.rows.map((row) => ({
      id: row.id,
      sent_at: row.sent_at,
      read_at: row.read_at,
      body: row.body,
      from_user: {
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
      },
    }));
  }
}

module.exports = User;
