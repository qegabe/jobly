"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "test",
    salary: 50000,
    equity: "0",
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { ...newJob, id: expect.any(Number) },
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 100000,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "a string",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[0],
          title: "j1",
          salary: 100000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: jobIds[1],
          title: "j2",
          salary: 50000,
          equity: "0.05",
          companyHandle: "c2",
        },
        {
          id: jobIds[2],
          title: "j3",
          salary: 75000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("can filter", async function () {
    const resp = await request(app).get(
      "/jobs?title=j&minSalary=50000&hasEquity=true"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[1],
          title: "j2",
          salary: 50000,
          equity: "0.05",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("bad request with bad query", async function () {
    const resp = await request(app).get("/jobs?notAFilter=true");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "j1-new",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${jobIds[0]}`).send({
      title: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        id: 5,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        salary: "a string",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: jobIds[0] });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${jobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
