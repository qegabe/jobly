const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", () => {
  const newJob = {
    title: "test",
    salary: 50000,
    equity: "0",
    companyHandle: "c1",
  };

  test("works", async () => {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number),
    });

    const result = await db.query(
      `
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = $1
      `,
      [job.id]
    );

    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "test",
        salary: 50000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", () => {
  test("works: no filter", async () => {
    let jobs = await Job.findAll();

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 50000,
        equity: "0.05",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 75000,
        equity: "0",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter title", async () => {
    const filter = {
      title: "2",
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 50000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter minSalary", async () => {
    const filter = {
      minSalary: "75000",
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 75000,
        equity: "0",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: filter hasEquity", async () => {
    const filter = {
      hasEquity: "true",
    };
    let jobs = await Job.findAll(filter);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 50000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });
});

/************************************** get */

describe("get", () => {
  test("works", async () => {
    let job = await Job.get(jobIds[0]);

    expect(job).toEqual({
      id: jobIds[0],
      title: "j1",
      salary: 100000,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async () => {
    try {
      await Job.get(0);
      fail();
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", () => {
  const updateData = {
    title: "New",
    salary: 10000,
    equity: "0.01",
  };

  test("works", async () => {
    let job = await Job.update(jobIds[0], updateData);

    expect(job).toEqual({
      ...updateData,
      id: jobIds[0],
      companyHandle: "c1",
    });

    const result = await db.query(
      `
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = $1
      `,
      [jobIds[0]]
    );

    expect(result.rows).toEqual([
      {
        id: jobIds[0],
        title: "New",
        salary: 10000,
        equity: "0.01",
        company_handle: "c1",
      },
    ]);
  });

  test("works: missing fields", async () => {
    let job = await Job.update(jobIds[0], { salary: 20000 });

    expect(job).toEqual({
      id: jobIds[0],
      title: "j1",
      salary: 20000,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = $1
      `,
      [jobIds[0]]
    );

    expect(result.rows).toEqual([
      {
        id: jobIds[0],
        title: "j1",
        salary: 20000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job", async () => {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async () => {
    try {
      await Job.update(jobIds[0], {});
      fail();
    } catch (error) {
      expect(error instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", () => {
  test("works", async () => {
    await Job.remove(jobIds[0]);

    const result = await db.query(
      `
      SELECT id
      FROM jobs
      WHERE id = $1
      `,
      [jobIds[0]]
    );

    expect(result.rows.length).toEqual(0);
  });

  test("not found if no such job", async () => {
    try {
      await Job.remove(0);
      fail();
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });
});
