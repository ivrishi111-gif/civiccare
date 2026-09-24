import { useEffect, useState } from 'react';
import { api } from './api.js';

let cached = null;

// Small shared hook: tells the UI whether the API is in demo mode / AI is off
export function useHealth() {
  const [health, setHealth] = useState(cached);
  useEffect(() => {
    if (cached) return;
    api('/api/health')
      .then((d) => {
        cached = d;
        setHealth(d);
      })
      .catch(() => {});
  }, []);
  return health;
}
