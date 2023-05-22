const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
  test("works: no jsToSql", () => {
    const data = {
      name: "Bob",
      age: 40,
    };
    const { setCols, values } = sqlForPartialUpdate(data, {});
    expect(setCols).toEqual('"name"=$1, "age"=$2');
    expect(values).toEqual(["Bob", 40]);
  });

  test("works: jsToSql", () => {
    const data = {
      firstName: "Bob",
      age: 40,
    };
    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "first_name",
    });
    expect(setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(values).toEqual(["Bob", 40]);
  });
});
