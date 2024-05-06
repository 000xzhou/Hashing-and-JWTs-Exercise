process.env.NODE_ENV === "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let testUserToken;
let messageData;
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
    messageData = message1;
  });
  /** GET /:id - get detail of message  */

  describe("GET /massages/:id", function () {
    test("get detail of message", async function () {
      let response = await request(app)
        .get(`/messages/${messageData.id}`)
        .send({ _token: testUserToken });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          from_user: {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000",
          },
          body: "yo test 2",
          sent_at: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
          ),
          read_at: null,
        },
      });
    });
  });
  test("returns 401 when logged out", async function () {
    const response = await request(app).get(`/messages/${messageData.id}`); // no token being sent!
    expect(response.statusCode).toBe(401);
  });
  test("returns 401 with invalid token", async function () {
    const response = await request(app)
      .get(`/messages/${messageData.id}`)
      .send({ _token: "garbage" }); // invalid token!
    expect(response.statusCode).toBe(401);
  });
});

/** POST /  create message */

describe("POST / create message", function () {
  test("create message", async function () {
    let response = await request(app).post("/messages").send({
      from_username: "test1",
      to_username: "test2",
      body: "WOW created!",
      _token: testUserToken,
    });
    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: {
        body: "WOW created!",
        from_username: "test1",
        id: expect.any(Number),
        sent_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
        to_username: "test2",
      },
    });
  });
  test("returns 401 when logged out", async function () {
    const response = await request(app).post(`/messages`).send({
      from_username: "test1",
      to_username: "test2",
      body: "WOW created!",
    }); // no token being sent!
    expect(response.statusCode).toBe(401);
  });
  test("returns 401 with invalid token", async function () {
    const response = await request(app).post(`/messages`).send({
      from_username: "test1",
      to_username: "test2",
      body: "WOW created!",
      _token: "garbage",
    }); // invalid token!
    expect(response.statusCode).toBe(401);
  });
});

describe("POST/:id/read - mark message as read:", function () {
  test("mark message as read", async function () {
    let response = await request(app)
      .post(`/messages/${messageData.id}/read`)
      .send({
        _token: testUserToken,
      });
    expect(response.statusCode).toBe(200);
    console.log(response.body);
    expect(response.body).toEqual({
      message: {
        id: expect.any(Number),
        read_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
        ),
      },
    });
  });
  test("returns 401 when logged out", async function () {
    const response = await request(app).post(
      `/messages/${messageData.id}/read`
    ); // no token being sent!
    expect(response.statusCode).toBe(401);
  });
  test("returns 401 with invalid token", async function () {
    const response = await request(app)
      .post(`/messages/${messageData.id}/read`)
      .send({
        _token: "garbage",
      }); // invalid token!
    expect(response.statusCode).toBe(401);
  });
});

afterAll(async function () {
  await db.end();
});
