// Shared labels + emoji icons. Keep in sync with server/constants.js
export const CATEGORIES = {
  Pothole: '🕳️',
  Garbage: '🗑️',
  Streetlight: '💡',
  'Water Leak': '💧',
  Drainage: '🌊',
  Footpath: '🚧',
  'Road Damage': '🛣️',
  Other: '📸',
};

export const CAT_LIST = Object.keys(CATEGORIES);

export const STATUS = {
  open: { label: 'Open', cls: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'In Progress', cls: 'bg-cyan-100 text-cyan-800' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
};

// Friendly short reference shown to users, e.g. CC-4F2A9C1B
export function refOf(id) {
  return 'CC-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
