const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */
class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const results = await db.query(
      `
      INSERT INTO jobs(title, salary, equity, company_handle)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, salary, equity, company_handle AS "companyHandle"
      `,
      [title, salary, equity, companyHandle]
    );

    const job = results.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Can filter results by passing in an object with any or all of:
   * - title - match name case-insensitive
   * - minSalary - salary greater or equal
   * - hasEquity - equity greater than 0 if true
   *
   * Calling with no argument or an empty filter object returns all jobs
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filter = {}) {
    const keys = Object.keys(filter);

    const matchers = [];
    const values = [];
    for (let key of keys) {
      const i = values.length + 1;
      switch (key) {
        case "title":
          matchers.push(`title ILIKE $${i}`);
          //add ILIKE wild cards for title
          values.push(`%${filter.title}%`);
          break;
        case "minSalary":
          matchers.push(`salary >= $${i}`);
          values.push(filter.minSalary);
          break;
        case "hasEquity":
          const m = filter.hasEquity === "true" ? `equity != 0` : `equity = 0`;
          matchers.push(m);
          break;
        default:
          break;
      }
    }

    let where = "";
    if (matchers.length > 0) {
      where = `WHERE ${matchers.join(" AND ")}`;
    }

    const results = await db.query(
      `
      SELECT id, 
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs
      ${where}
      ORDER BY title
      `,
      values
    );
    return results.rows;
  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const results = await db.query(
      `
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1
      `,
      [id]
    );

    const job = results.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `
      DELETE FROM jobs
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
