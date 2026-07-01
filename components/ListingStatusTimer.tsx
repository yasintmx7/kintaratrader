'use client';

import { useState, useEffect } from 'react';

export function ListingStatusTimer({ unlocksAt }: { unlocksAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!unlocksAt) return;
    const target = new Date(unlocksAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Unlocks Soon');
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeLeft(`Unlocks in ${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [unlocksAt]);

  return (
    <span className="td-mono" style={{ color: 'var(--kt-orange)', fontWeight: 'bold' }}>
      {timeLeft || 'Calculating...'}
    </span>
  );
}
