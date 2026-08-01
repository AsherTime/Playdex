/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Upload, ExternalLink, Copy, Trash2, TriangleAlert } from 'lucide-react';
import { GameType, Team } from '../types';
import { getTeams, deleteTeam, duplicateTeam, exportTeamsToJSON, importTeamsFromJSON } from '../utils/storage';
import { formatNumber } from '../utils/format';

export const SavedTeams: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [gameType, setGameType] = useState<GameType>('genshin');
  const [showWarnings, setShowWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location.state?.gameType === 'wuwa' || location.state?.gameType === 'genshin') {
      setGameType(location.state.gameType);
    }
  }, [location.state]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeams(await getTeams(gameType));
      } catch (error) {
        console.error('Failed to load teams:', error);
        setTeams([]);
        alert('Failed to load teams from the saved-teams folder. Make sure the local app server is running.');
      }
    };
    void loadTeams();
  }, [gameType]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importTeamsFromJSON(file);
        setTeams(await getTeams(gameType));
        alert('Teams imported successfully!');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import teams. Please check the file format.');
      }
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const searchLower = search.toLowerCase();
      const matchName = team.teamName.toLowerCase().includes(searchLower);
      const matchChars = team.characters.some((c) => 
        c.name.toLowerCase().includes(searchLower)
      );
      return matchName || matchChars;
    });
  }, [teams, search]);

  const rankedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      const aDps = a.dps ?? -1;
      const bDps = b.dps ?? -1;
      if (bDps !== aDps) {
        return bDps - aDps;
      }
      return b.totalDamage - a.totalDamage;
    });
  }, [filteredTeams]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(id, gameType);
        setTeams(await getTeams(gameType));
      } catch (error) {
        console.error('Failed to delete team:', error);
        alert('Failed to delete team from the saved-teams folder.');
      }
    }
  };

  const handleDuplicate = async (team: Team) => {
    try {
      await duplicateTeam(team);
      setTeams(await getTeams(gameType));
    } catch (error) {
      console.error('Failed to duplicate team:', error);
      alert('Failed to duplicate team into the saved-teams folder.');
    }
  };

  const handleOpen = (team: Team) => {
    navigate('/', { state: { team } });
  };

  const characterColumnCount = gameType === 'wuwa' ? 3 : 4;
  const warningCount = rankedTeams.filter((team) => team.unresolvedWarnings).length;
  const shouldShowWarningStatus = gameType === 'wuwa' && showWarnings;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase italic">
              Saved Teams
            </h1>
            <p className="text-white/30 font-bold uppercase tracking-[0.2em] text-xs mt-2">
              Manage and compare your team compositions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/10 active:scale-95"
              title="Import Teams JSON"
            >
              <Upload size={18} />
              Import
            </button>
            <button
              onClick={() => exportTeamsToJSON(gameType)}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/10 active:scale-95"
              title="Export Teams JSON"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={() => navigate('/', { state: { defaultGameType: gameType } })}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={20} />
              Create New Team
            </button>
            <button
              onClick={() => navigate('/character-comparison')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus size={20} />
              Character Comparison
            </button>
          </div>
        </header>

        <div className="mb-6">
          <div className="max-w-sm flex rounded-xl p-1 bg-slate-900 border border-white/10">
            <button
              type="button"
              onClick={() => setGameType('genshin')}
              className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={
                gameType === 'genshin'
                  ? { backgroundColor: 'rgba(37,99,235,0.25)', color: '#bfdbfe' }
                  : { color: 'rgba(255,255,255,0.75)' }
              }
            >
              Genshin Teams
            </button>
            <button
              type="button"
              onClick={() => setGameType('wuwa')}
              className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={
                gameType === 'wuwa'
                  ? { backgroundColor: 'rgba(16,185,129,0.25)', color: '#a7f3d0' }
                  : { color: 'rgba(255,255,255,0.75)' }
              }
            >
              WuWa Teams
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              placeholder="Search by team or character name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          {gameType === 'wuwa' ? (
            <button
              type="button"
              onClick={() => setShowWarnings((prev) => !prev)}
              role="switch"
              aria-checked={showWarnings}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10 md:min-w-[260px]"
              title="Toggle WuWa warning status in the ranking table"
            >
              <span className="flex items-center gap-2">
                <TriangleAlert size={18} className={showWarnings ? 'text-amber-300' : 'text-white/30'} />
                <span>
                  <span className="block text-xs font-black uppercase tracking-wider text-white/80">
                    Show Warnings
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {warningCount} issue{warningCount === 1 ? '' : 's'} found
                  </span>
                </span>
              </span>
              <span
                className={`relative h-6 w-11 rounded-full border transition-all ${
                  showWarnings
                    ? 'border-amber-400/40 bg-amber-400/25'
                    : 'border-white/10 bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                    showWarnings
                      ? 'left-6 bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.45)]'
                      : 'left-1 bg-white/40'
                  }`}
                />
              </span>
            </button>
          ) : null}
        </div>

        {/* Teams Table */}
        {rankedTeams.length > 0 ? (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-white/40">
                    <th className="text-left px-3 py-3 font-bold">Rank</th>
                    <th className="text-left px-3 py-3 font-bold">Team Name</th>
                    {shouldShowWarningStatus ? <th className="text-left px-3 py-3 font-bold">Status</th> : null}
                    {gameType === 'genshin' ? <th className="text-left px-3 py-3 font-bold">DPS</th> : null}
                    <th className="text-left px-3 py-3 font-bold">
                      {gameType === 'wuwa' ? 'Total Damage (DPR)' : 'Total Damage'}
                    </th>
                    <th className="text-left px-3 py-3 font-bold">Rotation</th>
                    {Array.from({ length: characterColumnCount }, (_, index) => (
                      <th key={index} className="text-left px-3 py-3 font-bold">{`Character ${index + 1}`}</th>
                    ))}
                    <th className="text-left px-3 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedTeams.map((team, index) => (
                    <tr
                      key={team.id}
                      className="border-b border-white/5 last:border-b-0 hover:bg-blue-500/5 transition-colors"
                      >
                      <td className="px-3 py-3 text-white/70 font-bold">#{index + 1}</td>
                      <td className="px-3 py-3 text-white font-bold whitespace-nowrap">
                        {team.teamName || 'Untitled Team'}
                      </td>
                      {shouldShowWarningStatus ? (
                        <td className="px-3 py-3 whitespace-nowrap">
                          {team.unresolvedWarnings ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                              <TriangleAlert size={14} />
                              Warning
                              <span className="text-amber-200/80">({team.unmatchedCount ?? 0})</span>
                            </div>
                          ) : (
                            <span className="text-emerald-300/80 text-xs font-semibold">Matched</span>
                          )}
                        </td>
                      ) : null}
                      {gameType === 'genshin' ? (
                        <td className="px-3 py-3 text-white/90 font-semibold whitespace-nowrap">
                          {formatNumber(team.dps ?? 0)}
                        </td>
                      ) : null}
                      <td className="px-3 py-3 text-white/80 font-semibold whitespace-nowrap">
                        {formatNumber(
                          gameType === 'wuwa' ? team.totalDamage / 1_000_000 : team.totalDamage,
                          gameType === 'wuwa' ? 'M' : 'k'
                        )}
                      </td>
                      <td className="px-3 py-3 text-white/70 whitespace-nowrap">{team.rotation}s</td>
                      {Array.from({ length: characterColumnCount }, (_, characterIndex) => (
                        <td key={characterIndex} className="px-3 py-3 text-white/70 whitespace-nowrap">
                          {team.characters[characterIndex]?.name || '-'}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpen(team)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold transition-all flex items-center gap-1"
                            title="Open Team"
                          >
                            <ExternalLink size={14} />
                            Open
                          </button>
                          <button
                            onClick={() => void handleDuplicate(team)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold transition-all flex items-center gap-1"
                            title="Duplicate Team"
                          >
                            <Copy size={14} />
                            Duplicate
                          </button>
                          <button
                            onClick={() => void handleDelete(team.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 font-semibold transition-all flex items-center gap-1"
                            title="Delete Team"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-white/20" />
            </div>
            <h3 className="text-xl font-bold text-white/50">No teams found</h3>
            <p className="text-white/20 text-sm mt-1">Try a different search or create a new team</p>
          </div>
        )}
      </div>
    </div>
  );
};
