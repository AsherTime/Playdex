/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Team } from '../types';
import { createDefaultTeam, normalizeTeamForGame } from '../data/defaultTeam';
import { TeamForm } from '../components/TeamForm';
import { TeamChart } from '../components/TeamChart';
import { saveTeam } from '../utils/storage';
import { ArrowLeft } from 'lucide-react';

export const CreateTeam: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team>(createDefaultTeam());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (location.state && location.state.team) {
      setTeam(normalizeTeamForGame(location.state.team));
      setIsEditing(true);
      return;
    }

    if (location.state && location.state.defaultGameType) {
      setTeam(createDefaultTeam(location.state.defaultGameType));
      setIsEditing(false);
    }
  }, [location.state]);

  const handleSave = async () => {
    if (!team.teamName.trim()) {
      alert('Please enter a team title before saving.');
      return;
    }
    try {
      await saveTeam(normalizeTeamForGame({ ...team, createdAt: Date.now() }));
      alert(isEditing ? 'Team updated successfully!' : 'Team saved successfully!');
      navigate('/saved', { state: { gameType: team.gameType } });
    } catch (error) {
      console.error('Failed to save team:', error);
      alert('Failed to save team into the saved-teams folder. Check the local API/dev server and try again.');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setTeam(createDefaultTeam(team.gameType || 'genshin'));
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-bottom border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/saved')}
            className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic">
              {isEditing ? 'Edit Team' : 'Create New Team'}
            </h1>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              {team.gameType === 'wuwa'
                ? 'Wuthering Waves Team Graphic Generator'
                : 'Genshin Impact Team Graphic Generator'}
            </p>
          </div>
        </div>
        <div
          className="flex rounded-xl p-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'rgba(37,99,235,0.25)', color: '#bfdbfe' }}
          >
            Team Comparison
          </Link>
          <Link
            to="/character-comparison"
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white"
          >
            Character Comparison
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <aside className="w-[450px] h-full border-r border-white/5 p-6">
          <TeamForm 
            team={team} 
            setTeam={setTeam} 
            onSave={handleSave} 
            onClear={handleClear}
            isEditing={isEditing}
          />
        </aside>

        {/* Right: Preview */}
        <section className="flex-1 h-full overflow-y-auto p-12 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <div className="max-w-4xl mx-auto">
            <TeamChart team={team} />
          </div>
        </section>
      </main>
    </div>
  );
};
