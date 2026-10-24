export const LIMITS = {
  serviceName: 100,
  description: 500,
  personName: 50,
  email: 100,
  phone: 20
};

export function validateService(body) {
  const errors = [];

  if (typeof body.name !== "string" || !body.name.trim()) {
    errors.push("service name is required");
  } else if (body.name.trim().length > LIMITS.serviceName) {
    errors.push(
      `service name cannot be longer than ${LIMITS.serviceName} characters`
    );
  }

  if (typeof body.description !== "string" || !body.description.trim()) {
    errors.push("description is required");
  } else if (body.description.trim().length > LIMITS.description) {
    errors.push(
      `description cannot be longer than ${LIMITS.description} characters`
    );
  }

  if (
    typeof body.expectedDuration !== "number" ||
    !Number.isFinite(body.expectedDuration) ||
    body.expectedDuration < 1
  ) {
    errors.push("expected duration must be a number greater than 0");
  }

  if (!["low", "medium", "high"].includes(body.priority)) {
    errors.push("priority must be low, medium, or high");
  }

  return errors;
}

export function validateEmployee(body) {
  const errors = [];

  if (typeof body.firstName !== "string" || !body.firstName.trim()) {
    errors.push("first name is required");
  } else if (body.firstName.trim().length > LIMITS.personName) {
    errors.push(
      `first name cannot be longer than ${LIMITS.personName} characters`
    );
  }

  if (typeof body.lastName !== "string" || !body.lastName.trim()) {
    errors.push("last name is required");
  } else if (body.lastName.trim().length > LIMITS.personName) {
    errors.push(
      `last name cannot be longer than ${LIMITS.personName} characters`
    );
  }

  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    body.email.length > LIMITS.email
  ) {
    errors.push("a valid email is required");
  }

  if (typeof body.phone !== "string" || !body.phone.trim()) {
    errors.push("phone number is required");
  } else if (body.phone.trim().length > LIMITS.phone) {
    errors.push(
      `phone number cannot be longer than ${LIMITS.phone} characters`
    );
  }

  return errors;
}
