/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { Team } from '../types';
import { StatCard } from './StatCard';
import { CharacterBar } from './CharacterBar';
import { formatNumber, formatRotation } from '../utils/format';

interface TeamChartProps {
  team: Team;
}

export const TeamChart: React.FC<TeamChartProps> = ({ team }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const isWuWa = team.gameType === 'wuwa';
  const note = isWuWa ? team.note?.trim() ?? '' : '';

  const handleExport = async () => {
    if (!chartRef.current) return;

    try {
      const chartEl = chartRef.current;
      const chartImages = Array.from(chartEl.querySelectorAll('img')) as HTMLImageElement[];

      // Ensure html2canvas captures fully loaded and decoded images.
      await Promise.all(
        chartImages.map(async (img) => {
          if (!img.complete || img.naturalWidth === 0) {
            await new Promise<void>((resolve) => {
              const done = () => {
                img.removeEventListener('load', done);
                img.removeEventListener('error', done);
                resolve();
              };
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            });
          }

          if (typeof img.decode === 'function') {
            try {
              await img.decode();
            } catch {
              // Ignore decode failures and continue export fallback path.
            }
          }
        })
      );

      // Give layout a brief settle window before rasterization.
      await new Promise((resolve) => setTimeout(resolve, 180));

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

      const dataUrl = await toPng(chartRef.current, {
        pixelRatio: 3,
        backgroundColor: '#0f172a',
        cacheBust: true,
      });

      const fileName = team.teamName
        ? `${team.teamName.toLowerCase().replace(/\s+/g, '-')}-graphic.png`
        : 'team-graphic.png';

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export graphic:', err);
      alert('Failed to export graphic. Please try again.');
    }
  };

  const maxShare = Math.max(...team.characters.map((c) => c.share), 1);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px] mx-auto">
      <div
        ref={chartRef}
        className="w-full rounded-2xl pt-4 px-3 pb-6 relative overflow-hidden"
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{
            backgroundImage:
              'linear-gradient(to right, transparent, rgba(59,130,246,0.5), transparent)',
          }}
        />
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full"
          style={{
            backgroundColor: 'rgba(59,130,246,0.05)',
            filter: 'blur(64px)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full"
          style={{
            backgroundColor: 'rgba(168,85,247,0.05)',
            filter: 'blur(64px)',
          }}
        />

        <div className="flex justify-center mb-6 relative z-10">
          <div
            className="flex rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
            }}
          >
            {!isWuWa ? <StatCard label="Avg DPS" value={formatNumber(team.dps ?? 0, 'k')} /> : null}
            <StatCard label={isWuWa ? 'Total DPR' : 'Total DMG'} value={formatNumber(team.totalDamage, 'M')} />
            <StatCard label="Rotation" value={formatRotation(team.rotation)} />
          </div>
        </div>

        <div className={`${isWuWa ? 'max-w-[360px]' : 'max-w-[340px]'} mx-auto relative z-10`}>
          <div className={`flex items-end justify-center h-[332px] ${isWuWa ? 'gap-6' : 'gap-2'}`}>
            {team.characters.map((char) => (
              <CharacterBar key={char.id} character={char} maxShare={maxShare} gameType={team.gameType} />
            ))}
          </div>
        </div>

        {note ? (
          <div
            className="relative z-10 mx-auto mt-5 max-w-[360px] rounded-xl px-4 py-3"
            style={{
              backgroundColor: 'rgba(15,23,42,0.78)',
              border: '1px solid rgba(16,185,129,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div
              className="mb-1 text-[9px] font-black uppercase tracking-wider"
              style={{ color: 'rgba(167,243,208,0.66)' }}
            >
              Team Note
            </div>
            <p className="text-[11px] font-medium leading-snug text-white/75 break-words">{note}</p>
          </div>
        ) : null}
      </div>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-all active:scale-95 group"
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(37,99,235,0.25)',
        }}
      >
        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
        Export {isWuWa ? 'WuWa' : 'Team'} Graphic
      </button>
    </div>
  );
};
