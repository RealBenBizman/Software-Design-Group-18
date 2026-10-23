import { sortByPriority } from "../utils/queueOrder.js";

const startingServices = [
  {
    id: 1,
    name: "FAFSA and Application Assistance",
    description: "FAFSA questions, missing documents, verification requirements, application status, and general financial aid guidance.",
    expectedDuration: 20,
    priority: "high",
    open: true
  },
  {
    id: 2,
    name: "Scholarships and Grants",
    description: "University scholarships, grants, eligibility requirements, deadlines, and award status.",
    expectedDuration: 20,
    priority: "medium",
    open: true
  },
  {
    id: 3,
    name: "Loans and Counseling",
    description: "Student loans, loan limits, counseling, and repayment questions.",
    expectedDuration: 30,
    priority: "medium",
    open: true
  },
  {
    id: 4,
    name: "Awards and Payments",
    description: "Aid offers, disbursement, refunds, holds, balances, and account issues.",
    expectedDuration: 20,
    priority: "high",
    open: false
  }
];

const startingQueues = {
  1: [
    { id: 101, userId: 11, name: "Maya Johnson", joined: "9:04 AM", status: "waiting", priority: "normal" },
    { id: 102, userId: 12, name: "Daniel Smith", joined: "9:11 AM", status: "waiting", priority: "normal" },
    { id: 103, userId: 13, name: "Sarah Williams", joined: "9:18 AM", status: "almost ready", priority: "high" }
  ],
  2: [
    { id: 201, userId: 21, name: "Chris Allen", joined: "9:10 AM", status: "waiting", priority: "normal" },
    { id: 202, userId: 22, name: "Nina Patel", joined: "9:22 AM", status: "waiting", priority: "normal" }
  ],
  3: [
    { id: 301, userId: 31, name: "Marcus Lee", joined: "9:03 AM", status: "waiting", priority: "normal" }
  ],
  4: [
    { id: 401, userId: 41, name: "Taylor Davis", joined: "9:15 AM", status: "waiting", priority: "normal" }
  ]
};

const startingEmployees = [
  {
    id: 1,
    firstName: "Jordan",
    lastName: "Smith",
    email: "jsmith@uh.edu",
    phone: "713-555-0101",
    role: "employee",
    serviceId: 1,
    status: "working"
  },
  {
    id: 2,
    firstName: "Ashley",
    lastName: "Brown",
    email: "abrown@uh.edu",
    phone: "713-555-0102",
    role: "employee",
    serviceId: 2,
    status: "working"
  },
  {
    id: 3,
    firstName: "Marcus",
    lastName: "Davis",
    email: "mdavis@uh.edu",
    phone: "713-555-0103",
    role: "employee",
    serviceId: null,
    status: "offline"
  }
];

const startingAppointments = [
  {
    id: 1,
    userId: 11,
    serviceId: 1,
    name: "Marcus Jones",
    date: "2026-10-21",
    time: "10:30 AM",
    status: "upcoming"
  },
  {
    id: 2,
    userId: 12,
    serviceId: 1,
    name: "Samantha Lee",
    date: "2026-10-21",
    time: "1:00 PM",
    status: "upcoming"
  },
  {
    id: 3,
    userId: 21,
    serviceId: 2,
    name: "Noah Wilson",
    date: "2026-10-21",
    time: "11:00 AM",
    status: "checked in"
  }
];

const startingReports = [
  {
    id: 1001,
    userId: 11,
    user: "I. Student",
    date: "2026-10-20",
    category: "System Issue",
    description: "The queue status did not update right away.",
    status: "open"
  },
  {
    id: 1002,
    userId: 22,
    user: "J. Applicant",
    date: "2026-10-19",
    category: "Service",
    description: "The estimated wait time was longer than expected.",
    status: "reviewing"
  }
];

const copy = (value) => JSON.parse(JSON.stringify(value));

// every queue is kept in serve order: priority first, then arrival
const prepareQueues = (queues) =>
  Object.fromEntries(
    Object.entries(copy(queues)).map(([serviceId, queue]) => [
      serviceId,
      sortByPriority(queue)
    ])
  );

export const store = {
  services: copy(startingServices),
  queues: prepareQueues(startingQueues),
  employees: copy(startingEmployees),
  appointments: copy(startingAppointments),
  reports: copy(startingReports),
  activity: {
    studentsServed: 46,
    appointmentsCompleted: 15,
    noShows: 3
  }
};

export function resetStore() {
  store.services = copy(startingServices);
  store.queues = prepareQueues(startingQueues);
  store.employees = copy(startingEmployees);
  store.appointments = copy(startingAppointments);
  store.reports = copy(startingReports);
  store.activity = {
    studentsServed: 46,
    appointmentsCompleted: 15,
    noShows: 3
  };
}
