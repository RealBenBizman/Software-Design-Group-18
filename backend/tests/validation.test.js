import {
  LIMITS,
  validateService,
  validateEmployee
} from "../src/utils/validation.js";

const validService = {
  name: "Veteran Benefits Help",
  description: "Help with veteran education benefits.",
  expectedDuration: 15,
  priority: "medium"
};

const validEmployee = {
  firstName: "Jordan",
  lastName: "Smith",
  email: "new.employee@uh.edu",
  phone: "713-555-0199"
};

const tooLong = (limit) => "a".repeat(limit + 1);

describe("service validation", () => {
  test("accepts a valid service", () => {
    expect(validateService(validService)).toEqual([]);
  });

  test("accepts a description exactly at the limit", () => {
    const service = { ...validService, description: "a".repeat(LIMITS.description) };

    expect(validateService(service)).toEqual([]);
  });

  test("rejects a description over the limit", () => {
    const service = { ...validService, description: tooLong(LIMITS.description) };

    expect(validateService(service)).toEqual([
      `description cannot be longer than ${LIMITS.description} characters`
    ]);
  });

  test("rejects wrong field types", () => {
    const errors = validateService({
      name: 123,
      description: ["not", "a", "string"],
      expectedDuration: "20",
      priority: "urgent"
    });

    expect(errors).toHaveLength(4);
  });
});

describe("employee validation", () => {
  test("accepts a valid employee", () => {
    expect(validateEmployee(validEmployee)).toEqual([]);
  });

  test("rejects a first name over the limit", () => {
    const employee = { ...validEmployee, firstName: tooLong(LIMITS.personName) };

    expect(validateEmployee(employee)).toEqual([
      `first name cannot be longer than ${LIMITS.personName} characters`
    ]);
  });

  test("rejects a last name over the limit", () => {
    const employee = { ...validEmployee, lastName: tooLong(LIMITS.personName) };

    expect(validateEmployee(employee)).toEqual([
      `last name cannot be longer than ${LIMITS.personName} characters`
    ]);
  });

  test("rejects a phone number over the limit", () => {
    const employee = { ...validEmployee, phone: "1".repeat(LIMITS.phone + 1) };

    expect(validateEmployee(employee)).toEqual([
      `phone number cannot be longer than ${LIMITS.phone} characters`
    ]);
  });

  test("rejects an email over the limit", () => {
    const employee = {
      ...validEmployee,
      email: `${"a".repeat(LIMITS.email)}@uh.edu`
    };

    expect(validateEmployee(employee)).toEqual(["a valid email is required"]);
  });

  test("rejects missing and wrongly typed fields", () => {
    const errors = validateEmployee({ firstName: "", lastName: 5, phone: null });

    expect(errors).toHaveLength(4);
  });
});
