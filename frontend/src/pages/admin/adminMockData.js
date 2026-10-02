export const initialAdminServices = [
  {
    id: 1,
    name: "FAFSA & Application Help",
    description:
      "FAFSA questions, missing documents, verification requirements, application status, and general financial aid guidance.",
    duration: 20,
    priority: "high",
    open: true,
  },
  {
    id: 2,
    name: "Scholarships & Grants",
    description:
      "University scholarships, grants, eligibility requirements, deadlines, and award status.",
    duration: 20,
    priority: "medium",
    open: true,
  },
  {
    id: 3,
    name: "Loans & Counseling",
    description:
      "Student loans, accepting or declining loans, loan limits, counseling, and repayment questions.",
    duration: 30,
    priority: "medium",
    open: true,
  },
  {
    id: 4,
    name: "Awards & Disbursement",
    description:
      "Aid offers, disbursement, refunds, holds, balances, and account issues.",
    duration: 20,
    priority: "high",
    open: false,
  },
];

export const initialAdminQueues = {
  1: [
    { id: 101, name: "Maya Johnson", joined: "9:04 AM", status: "waiting" },
    { id: 102, name: "Daniel Smith", joined: "9:11 AM", status: "waiting" },
    { id: 103, name: "Sarah Williams", joined: "9:18 AM", status: "almost ready" },
    { id: 104, name: "Jordan Brown", joined: "9:24 AM", status: "waiting" },
    { id: 105, name: "Alicia Green", joined: "9:31 AM", status: "waiting" },
  ],
  2: [
    { id: 201, name: "Chris Allen", joined: "9:10 AM", status: "waiting" },
    { id: 202, name: "Nina Patel", joined: "9:22 AM", status: "waiting" },
    { id: 203, name: "Luis Garcia", joined: "9:36 AM", status: "waiting" },
  ],
  3: [
    { id: 301, name: "Marcus Lee", joined: "9:03 AM", status: "waiting" },
    { id: 302, name: "Emily Carter", joined: "9:27 AM", status: "waiting" },
  ],
  4: [
    { id: 401, name: "Taylor Davis", joined: "9:15 AM", status: "waiting" },
  ],
};

export const initialEmployees = [
  {
    id: 1,
    firstName: "Jordan",
    lastName: "Smith",
    email: "jsmith@uh.edu",
    phone: "713-555-0101",
    role: "Employee",
    serviceId: 1,
    status: "working",
  },
  {
    id: 2,
    firstName: "Ashley",
    lastName: "Brown",
    email: "abrown@uh.edu",
    phone: "713-555-0102",
    role: "Employee",
    serviceId: 2,
    status: "working",
  },
  {
    id: 3,
    firstName: "Marcus",
    lastName: "Davis",
    email: "mdavis@uh.edu",
    phone: "713-555-0103",
    role: "Employee",
    serviceId: 3,
    status: "working",
  },
  {
    id: 4,
    firstName: "Olivia",
    lastName: "Wilson",
    email: "owilson@uh.edu",
    phone: "713-555-0104",
    role: "Employee",
    serviceId: null,
    status: "offline",
  },
];

export const initialReports = [
  {
    id: 1001,
    date: "Oct 1",
    user: "I. Student",
    category: "System Issue",
    description: "The queue status did not update right away.",
    status: "open",
  },
  {
    id: 1002,
    date: "Sep 30",
    user: "J. Applicant",
    category: "Service",
    description: "The estimated wait time was longer than expected.",
    status: "reviewing",
  },
  {
    id: 1003,
    date: "Sep 29",
    user: "A. Student",
    category: "Employee",
    description: "I need help following up on my appointment.",
    status: "resolved",
  },
];

export const activityData = {
  studentsServed: 46,
  appointmentsCompleted: 15,
  noShows: 3,
  averageWait: 24,
};
