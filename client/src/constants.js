// Keep in sync with server/constants.js
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

export const CATEGORY_ICONS = {
  Pothole: '🕳️',
  Garbage: '🗑️',
  Streetlight: '💡',
  'Water Leak': '💧',
  Drainage: '🌊',
  Footpath: '🚶',
  'Road Damage': '🚧',
  Other: '📍',
};

// Status colours — ocean blue / teal / green palette
export const STATUS_STYLE = {
  open: { bg: '#e0f2fe', text: '#075985', bar: '#0ea5e9' },
  assigned: { bg: '#fde68a', text: '#92400e', bar: '#f59e0b' },
  in_progress: { bg: '#ccfbf1', text: '#115e59', bar: '#14b8a6' },
  completed: { bg: '#dcfce7', text: '#166534', bar: '#22c55e' },
  resolved: { bg: '#dcfce7', text: '#15803d', bar: '#16a34a' },
};

// Progress steps shown on complaint cards
export const PROGRESS_STEPS = ['open', 'assigned', 'in_progress', 'completed', 'resolved'];

export function statusIndex(status) {
  const i = PROGRESS_STEPS.indexOf(status);
  return i === -1 ? 0 : i;
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function shortId(id) {
  return (id || '').slice(0, 8).toUpperCase();
}
