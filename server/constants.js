// Shared lists — keep in sync with client/src/constants.js
export const CATEGORIES = [
  'Pothole',
  'Garbage',
  'Streetlight',
  'Water Leak',
  'Drainage',
  'Footpath',
  'Road Damage',
  'Other',
];

// Complaint lifecycle: user submits → authority assigns → work → proof → resolved
export const STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'resolved'];

export const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  resolved: 'Resolved',
};

// Demo accounts (clearly fictional)
export const DEMO_CITIZEN = {
  name: 'Demo Citizen',
  email: 'demo@civiccare.in',
  phone: '+919876543210',
  password: 'Demo@123',
};

export const DEMO_AUTHORITY = {
  name: 'Municipal Works (Demo)',
  phone: '+919999999999',
  department: 'Municipal Corporation',
  area: 'Sample City (demo data)',
  password: 'Demo@123',
};
