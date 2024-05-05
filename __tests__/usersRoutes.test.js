process.env.NODE_ENV === "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let testUserToken;

describe("USERS Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let testUser = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let testUser2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550000",
    });
    let message1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "yo test 2",
    });
    let message2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "yo test 1",
    });
    testUserToken = jwt.sign(
      { username: testUser.username },
      process.env.SECRET_KEY
    );
  });

  /** GET / - get list of users  */

  describe("GET /users", function () {
    test("can get list of users", async function () {
      let response = await request(app)
        .get("/users")
        .send({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        user: [
          {
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
            username: "test1",
          },
          {
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000",
            username: "test2",
          },
        ],
      });
    });
    test("returns 401 when logged out", async function () {
      const response = await request(app).get(`/users`); // no token being sent!
      expect(response.statusCode).toBe(401);
    });
    test("returns 401 with invalid token", async function () {
      const response = await request(app)
        .get(`/users`)
        .send({ _token: "garbage" }); // invalid token!
      expect(response.statusCode).toBe(401);
    });
  });
});

/** GET /:username/to - get messages to user */

describe("GET /:username/to and from", function () {
  test("can get messages to user", async function () {
    let response = await request(app)
      .get("/users/test1/to")
      .send({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      messages: [
        {
          body: "yo test 1",
          id: expect.any(Number),
          read_at: null,
          sent_at: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
          ),
          from_user: {
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000",
            username: "test2",
          },
        },
      ],
    });
  });
  test("can get messages from user", async function () {
    let response = await request(app)
      .get("/users/test1/from")
      .send({ _token: testUserToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      messages: [
        {
          body: "yo test 2",
          to_user: {
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000",
            username: "test2",
          },
          id: expect.any(Number),
          read_at: null,
          //   sent_at: expect.any(Date),
          sent_at: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
          ),
        },
      ],
    });
  });
});

afterAll(async function () {
  await db.end();
});
