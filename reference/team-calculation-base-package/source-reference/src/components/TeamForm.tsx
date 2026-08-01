/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, AlertCircle, ClipboardPaste, TriangleAlert } from 'lucide-react';
import {
  Team,
  Character,
  COMMON_ROLES,
  ElementType,
  GameType,
  GENSHIN_ELEMENT_TYPES,
  WUWA_ELEMENT_TYPES,
  getElementColors,
} from '../types';
import { createDefaultTeam, normalizeElementForGame, normalizeTeamForGame } from '../data/defaultTeam';
import { getWuWaCharacterDefinition, getWuWaSignatureWeapon } from '../data/wuwaData';
import {
  getCharacterImagePath,
  getWeaponImagePath,
  getResolvedImage,
} from '../utils/imageMatcher';
import { parseTeamData, parseWuWaBulkImport } from '../utils/parser';
import { saveTeam } from '../utils/storage';

interface TeamFormProps {
  team: Team;
  setTeam: React.Dispatch<React.SetStateAction<Team>>;
  onSave: () => void;
  onClear: () => void;
  isEditing: boolean;
}

interface BulkImportSummary {
  importedCount: number;
  warningCount: number;
}

const getElementOptions = (gameType: GameType): readonly ElementType[] => {
  return gameType === 'wuwa'
    ? (WUWA_ELEMENT_TYPES as readonly ElementType[])
    : (GENSHIN_ELEMENT_TYPES as readonly ElementType[]);
};

const applyCharacterNameRules = (
  character: Character,
  gameType: GameType,
  nextName: string
): Character => {
  if (gameType !== 'wuwa') {
    return {
      ...character,
      name: nextName,
    };
  }

  return {
    ...character,
    name: nextName,
    element: normalizeElementForGame(character.element, 'wuwa', nextName),
  };
};

const shouldApplyWuWaSignatureWeaponDefault = (
  character: Character,
  previousAutoFilledWeapon?: string
): boolean => {
  const currentWeaponName = character.weaponName.trim();
  if (!currentWeaponName) return true;
  if (previousAutoFilledWeapon && currentWeaponName === previousAutoFilledWeapon) return true;

  const currentCharacterSignatureWeapon = getWuWaSignatureWeapon(character.name);
  return Boolean(currentCharacterSignatureWeapon && currentWeaponName === currentCharacterSignatureWeapon);
};

const mergeParsedCharacter = (
  character: Character,
  gameType: GameType,
  parsedCharacter: { name: string; share: number; weaponName: string }
): Character => {
  const withName = parsedCharacter.name
    ? applyCharacterNameRules(character, gameType, parsedCharacter.name)
    : character;

  return {
    ...withName,
    share: parsedCharacter.share || withName.share,
    weaponName: parsedCharacter.weaponName || withName.weaponName,
  };
};

export const TeamForm: React.FC<TeamFormProps> = ({
  team,
  setTeam,
  onSave,
  onClear,
  isEditing,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportSummary, setBulkImportSummary] = useState<BulkImportSummary | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [failedCharacterImages, setFailedCharacterImages] = useState<Record<string, boolean>>({});
  const [failedWeaponImages, setFailedWeaponImages] = useState<Record<string, boolean>>({});
  const autoFilledWeaponByCharacterId = useRef<Record<string, string>>({});
  const isWuWa = team.gameType === 'wuwa';

  useEffect(() => {
    setFailedCharacterImages({});
    setFailedWeaponImages({});
  }, [team.gameType, team.characters]);

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTeam((prev) => ({
      ...prev,
      [name]: name === 'teamName' || name === 'note' ? value : Number(value),
    }));
  };

  const handleGameTypeChange = (gameType: GameType) => {
    setTeam((prev) => normalizeTeamForGame({ ...prev, gameType }));
    setBulkImportSummary(null);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseTeamData(pasteText);

    setTeam((prev) => {
      const updatedCharacters = prev.characters.map((character, index) => {
        const parsedCharacter = parsed.characters?.[index];
        return parsedCharacter ? mergeParsedCharacter(character, prev.gameType, parsedCharacter) : character;
      });

      return normalizeTeamForGame({
        ...prev,
        dps: prev.gameType === 'wuwa' ? undefined : parsed.dps ?? prev.dps,
        totalDamage: parsed.totalDamage ?? prev.totalDamage,
        rotation: parsed.rotation ?? prev.rotation,
        characters: updatedCharacters,
      });
    });

    setPasteText('');
  };

  const handleCharacterChange = (index: number, field: keyof Character, value: string | number | ElementType) => {
    setTeam((prev) => {
      const nextCharacters = [...prev.characters];
      const currentCharacter = nextCharacters[index];
      let nextCharacter: Character = {
        ...currentCharacter,
        [field]: value,
      } as Character;

      if (prev.gameType === 'wuwa' && field === 'name') {
        nextCharacter = applyCharacterNameRules(currentCharacter, 'wuwa', String(value));
        const signatureWeapon = getWuWaSignatureWeapon(String(value));
        if (
          signatureWeapon &&
          shouldApplyWuWaSignatureWeaponDefault(
            currentCharacter,
            autoFilledWeaponByCharacterId.current[currentCharacter.id]
          )
        ) {
          nextCharacter.weaponName = signatureWeapon;
          autoFilledWeaponByCharacterId.current[currentCharacter.id] = signatureWeapon;
        }
      }

      if (prev.gameType === 'wuwa' && field === 'weaponName') {
        const signatureWeapon = getWuWaSignatureWeapon(currentCharacter.name);
        if (signatureWeapon && String(value).trim() === '') {
          nextCharacter.weaponName = signatureWeapon;
          autoFilledWeaponByCharacterId.current[currentCharacter.id] = signatureWeapon;
        }
      }

      if (prev.gameType === 'wuwa' && field === 'element') {
        const knownCharacter = getWuWaCharacterDefinition(currentCharacter.name);
        nextCharacter.element = knownCharacter?.element ?? (value as ElementType);
      }

      nextCharacters[index] = nextCharacter;
      return normalizeTeamForGame({ ...prev, characters: nextCharacters });
    });
  };

  const handleImageUpload = (
    index: number,
    field: 'manualCharacterImage' | 'manualWeaponImage',
    file: File | null
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleCharacterChange(index, field, (reader.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim() || !isWuWa) return;

    const parsedTeams = parseWuWaBulkImport(bulkImportText);
    if (!parsedTeams.length) {
      alert('No WuWa teams could be parsed from that paste.');
      return;
    }

    setIsBulkImporting(true);
    setBulkImportSummary(null);

    try {
      let warningCount = 0;

      for (let index = 0; index < parsedTeams.length; index += 1) {
        const parsedTeam = parsedTeams[index];
        const baseTeam = createDefaultTeam('wuwa');
        const nextCharacters = baseTeam.characters.map((character, characterIndex) => {
          const parsedCharacter = parsedTeam.characters[characterIndex];
          if (!parsedCharacter) return character;

          return mergeParsedCharacter(character, 'wuwa', {
            ...parsedCharacter,
            share: parsedCharacter.share || character.share,
          });
        });

        const savedTeam = await saveTeam(
          normalizeTeamForGame({
            ...baseTeam,
            teamName: parsedTeam.teamName || `WuWa Team ${index + 1}`,
            totalDamage: parsedTeam.totalDamage ?? 0,
            rotation: parsedTeam.rotation ?? baseTeam.rotation,
            createdAt: Date.now() + index,
            characters: nextCharacters,
          })
        );

        if (savedTeam.unresolvedWarnings) {
          warningCount += 1;
        }
      }

      setBulkImportSummary({
        importedCount: parsedTeams.length,
        warningCount,
      });
      setBulkImportText('');
    } catch (error) {
      console.error('Failed to bulk import WuWa teams:', error);
      alert('WuWa bulk import failed. Please try again.');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const totalShare = team.characters.reduce((sum, character) => sum + character.share, 0);

  return (
    <div className="flex flex-col gap-8 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm h-full overflow-y-auto custom-scrollbar">
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardPaste size={20} className="text-blue-400" />
          Quick Import
        </h3>
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={
              isWuWa
                ? 'Paste one WuWa team block here. Known characters auto-fill their element.'
                : 'Paste team data here (e.g. DPS: 122.4k, Character - 27%, etc.)'
            }
            className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-white/20"
          />
          <button
            onClick={handleParsePaste}
            disabled={!pasteText.trim()}
            className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 font-bold rounded-xl border border-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            Parse Pasted Team Data
          </button>
        </div>
      </section>

      {isWuWa ? (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TriangleAlert size={20} className="text-emerald-400" />
            WuWa Bulk Import
          </h3>
          <p className="text-sm text-white/55">
            Paste multiple WuWa team blocks at once. Teams still save even when some character or weapon
            names need manual cleanup later.
          </p>
          <div className="space-y-3">
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder="Paste multiple WuWa team blocks here. Separate teams with blank lines or ---."
              className="w-full h-44 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none placeholder:text-white/20"
            />
            <button
              onClick={() => void handleBulkImport()}
              disabled={!bulkImportText.trim() || isBulkImporting}
              className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isBulkImporting ? 'Importing WuWa Teams...' : 'Import WuWa Teams'}
            </button>
            {bulkImportSummary ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-white/80">
                Imported {bulkImportSummary.importedCount} WuWa team
                {bulkImportSummary.importedCount === 1 ? '' : 's'}.
                {bulkImportSummary.warningCount > 0
                  ? ` ${bulkImportSummary.warningCount} saved team${
                      bulkImportSummary.warningCount === 1 ? '' : 's'
                    } still have unresolved warnings.`
                  : ' All imported teams matched cleanly.'}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full" />
          Team Overview
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Team Title</label>
            <input
              type="text"
              name="teamName"
              value={team.teamName}
              onChange={handleTeamChange}
              placeholder={isWuWa ? 'e.g. Jiyan Hypercarry' : 'e.g. Raiden National'}
              className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Game</label>
            <div className="flex rounded-xl p-1 bg-slate-800 border border-white/10">
              <button
                type="button"
                onClick={() => handleGameTypeChange('genshin')}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                style={
                  isWuWa
                    ? { color: 'rgba(255,255,255,0.75)' }
                    : { backgroundColor: 'rgba(37,99,235,0.25)', color: '#bfdbfe' }
                }
              >
                Genshin Impact
              </button>
              <button
                type="button"
                onClick={() => handleGameTypeChange('wuwa')}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                style={
                  isWuWa
                    ? { backgroundColor: 'rgba(16,185,129,0.25)', color: '#a7f3d0' }
                    : { color: 'rgba(255,255,255,0.75)' }
                }
              >
                Wuthering Waves
              </button>
            </div>
          </div>
          <div className={`grid gap-4 ${isWuWa ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {!isWuWa ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Avg DPS</label>
                <input
                  type="number"
                  name="dps"
                  value={team.dps ?? 0}
                  onChange={handleTeamChange}
                  className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                {isWuWa ? 'Total Damage (DPR)' : 'Total DMG'}
              </label>
              <input
                type="number"
                name="totalDamage"
                value={team.totalDamage}
                onChange={handleTeamChange}
                className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Rotation Time</label>
              <input
                type="number"
                name="rotation"
                value={team.rotation}
                onChange={handleTeamChange}
                className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          {isWuWa ? (
            <div className="flex flex-col gap-1 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
              <label className="text-xs font-bold text-emerald-200/60 uppercase tracking-wider">
                Team Note
              </label>
              <textarea
                name="note"
                value={team.note ?? ''}
                onChange={handleTeamChange}
                placeholder="Add a short note about the team..."
                maxLength={180}
                className="h-20 bg-slate-950/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-white/20"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full" />
            Characters
          </h3>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              totalShare === 100 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {totalShare !== 100 && <AlertCircle size={12} />}
            Total Share: {totalShare}%
          </div>
        </div>

        <div className="space-y-8">
          {team.characters.map((char, idx) => {
            const charKey = `${char.id}:character`;
            const weaponKey = `${char.id}:weapon`;
            const knownWuWaCharacter = isWuWa ? getWuWaCharacterDefinition(char.name) : null;
            const autoCharImg = getCharacterImagePath(char.name, team.gameType);
            const autoWeaponImg = getWeaponImagePath(char.weaponName, team.gameType);
            const resolvedCharImg = getResolvedImage(
              failedCharacterImages[charKey] ? null : autoCharImg,
              char.manualCharacterImage
            );
            const resolvedWeaponImg = getResolvedImage(
              failedWeaponImages[weaponKey] ? null : autoWeaponImg,
              char.manualWeaponImage
            );
            const colors = getElementColors(char.element, team.gameType);

            return (
              <div
                key={char.id}
                className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4 relative group"
              >
                <div
                  className="absolute -left-2 top-4 w-1 h-12 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)}
                      placeholder="Character Name"
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Weapon Name
                    </label>
                    <input
                      type="text"
                      value={char.weaponName}
                      onChange={(e) => handleCharacterChange(idx, 'weaponName', e.target.value)}
                      placeholder="Weapon Name"
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Role</label>
                    <select
                      value={char.role}
                      onChange={(e) => handleCharacterChange(idx, 'role', e.target.value)}
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      {COMMON_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      {!COMMON_ROLES.includes(char.role) ? <option value={char.role}>{char.role}</option> : null}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Share %</label>
                    <input
                      type="number"
                      value={char.share}
                      onChange={(e) => handleCharacterChange(idx, 'share', Number(e.target.value))}
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Element
                    </label>
                    <select
                      value={char.element}
                      onChange={(e) => handleCharacterChange(idx, 'element', e.target.value as ElementType)}
                      disabled={Boolean(knownWuWaCharacter)}
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {getElementOptions(team.gameType).map((element) => (
                        <option key={element} value={element}>
                          {element}
                        </option>
                      ))}
                    </select>
                    {isWuWa ? (
                      <span className="text-[10px] text-white/40">
                        {knownWuWaCharacter
                          ? `Auto-filled from ${knownWuWaCharacter.canonicalName}`
                          : 'Manual override available for unknown WuWa names'}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer group/img relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden group-hover/img:border-blue-500 transition-colors">
                        {resolvedCharImg ? (
                          <img
                            src={resolvedCharImg}
                            className="w-full h-full object-cover"
                            onError={() => {
                              setFailedCharacterImages((prev) => ({ ...prev, [charKey]: true }));
                            }}
                          />
                        ) : (
                          <ImageIcon size={16} className="text-white/20" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(idx, 'manualCharacterImage', e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Character Icon
                      </span>
                      <button
                        onClick={() => handleCharacterChange(idx, 'manualCharacterImage', '')}
                        className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase text-left"
                      >
                        {char.manualCharacterImage ? 'Clear Manual' : 'Auto-Match Active'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer group/img relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden group-hover/img:border-blue-500 transition-colors">
                        {resolvedWeaponImg ? (
                          <img
                            src={resolvedWeaponImg}
                            className="w-full h-full object-cover"
                            onError={() => {
                              setFailedWeaponImages((prev) => ({ ...prev, [weaponKey]: true }));
                            }}
                          />
                        ) : (
                          <ImageIcon size={16} className="text-white/20" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(idx, 'manualWeaponImage', e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Weapon Icon
                      </span>
                      <button
                        onClick={() => handleCharacterChange(idx, 'manualWeaponImage', '')}
                        className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase text-left"
                      >
                        {char.manualWeaponImage ? 'Clear Manual' : 'Auto-Match Active'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex gap-4 pt-4 mt-auto border-t border-white/5">
        <button
          onClick={onClear}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-95"
        >
          Clear Form
        </button>
        <button
          onClick={onSave}
          className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {isEditing ? 'Update Team' : 'Save Team'}
        </button>
      </div>
    </div>
  );
};
