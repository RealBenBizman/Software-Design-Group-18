export const initialServices = [
  {
    id: 1,
    name: "FAFSA & Application Help",
    description: "FAFSA questions, missing documents, verification, and application status.",
    open: true,
    minutesPerPerson: 5,
  },
  {
    id: 2,
    name: "Scholarships & Grants",
    description: "Scholarships, grants, eligibility, deadlines, and award status.",
    open: true,
    minutesPerPerson: 6,
  },
  {
    id: 3,
    name: "Loans & Counseling",
    description: "Student loans, loan limits, counseling, and repayment questions.",
    open: true,
    minutesPerPerson: 8,
  },
  {
    id: 4,
    name: "Awards & Disbursement",
    description: "Aid offers, refunds, holds, balances, and disbursement questions.",
    open: false,
    minutesPerPerson: 6,
  },
];

export const initialQueues = {
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

export const initialAppointments = [
  {
    id: 1,
    serviceId: 1,
    name: "Marcus Jones",
    time: "10:30 AM",
    date: "Today",
    status: "upcoming",
  },
  {
    id: 2,
    serviceId: 1,
    name: "Samantha Lee",
    time: "1:00 PM",
    date: "Today",
    status: "upcoming",
  },
  {
    id: 3,
    serviceId: 2,
    name: "Noah Wilson",
    time: "11:00 AM",
    date: "Today",
    status: "checked in",
  },
  {
    id: 4,
    serviceId: 3,
    name: "Ava Martin",
    time: "2:15 PM",
    date: "Today",
    status: "upcoming",
  },
  {
    id: 5,
    serviceId: 4,
    name: "Ethan Moore",
    time: "3:00 PM",
    date: "Today",
    status: "upcoming",
  },
];
