/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div
      className="flex flex-col items-center px-4 py-1.5 last:border-r-0"
      style={{ borderRight: '1px solid rgba(255,255,255,0.10)' }}
    >
      <span
        className="text-[11px] uppercase tracking-widest font-bold"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-black tracking-tight"
        style={{ color: '#ffffff' }}
      >
        {value}
      </span>
    </div>
  );
};
