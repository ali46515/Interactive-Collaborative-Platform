import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import User from "../../src/modules/auth/auth.model.js";

const TEST_MONGO_URI =
  process.env.TEST_MONGO_URI || "mongodb://localhost:27017/...";

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

const testUser = {
  username: "testuser",
  email: "test@example.com",
  password: "SecurePass1",
};

describe("POST /api/auth/register", () => {
  test("registers a new user and returns tokens", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test("rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(409);
  });

  test("rejects weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...testUser, password: "1234" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  test("rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...testUser, email: "not-an-email" });

    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(testUser);
  });

  test("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test("rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "WrongPass1" });

    expect(res.status).toBe(401);
  });

  test("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "SecurePass1" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  test("returns user profile with valid token", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    const { accessToken } = registerRes.body.data;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  test("rejects request without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("rejects invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  test("successfully logs out", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(testUser);
    const { accessToken } = registerRes.body.data;

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(meRes.status).toBe(401);
  });
});
