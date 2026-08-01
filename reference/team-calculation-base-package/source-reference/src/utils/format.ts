/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const formatNumber = (num: number, unit: 'k' | 'M' = 'k'): string => {
  if (unit === 'M') {
    return num.toFixed(2).replace(/\.00$/, '') + 'M';
  }
  return num.toFixed(1).replace(/\.0$/, '') + 'k';
};

export const formatRotation = (num: number): string => {
  return num.toFixed(1) + 's';
};
