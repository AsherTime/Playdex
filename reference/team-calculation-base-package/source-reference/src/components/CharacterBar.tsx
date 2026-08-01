/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Character, GameType, getElementColors } from '../types';
import { getCharacterImagePath, getWeaponImagePath, getResolvedImage } from '../utils/imageMatcher';

interface CharacterBarProps {
  character: Character;
  maxShare: number;
  gameType?: GameType;
}

export const CharacterBar: React.FC<CharacterBarProps> = ({ character, maxShare, gameType = 'genshin' }) => {
  const resolvedGameType = gameType as GameType;
  const isWuWa = resolvedGameType === 'wuwa';
  const colors = getElementColors(character.element, resolvedGameType);
  const charImg =
    getResolvedImage(getCharacterImagePath(character.name, resolvedGameType), character.manualCharacterImage) || null;
  const weaponImg =
    getResolvedImage(getWeaponImagePath(character.weaponName, resolvedGameType), character.manualWeaponImage) || null;
  const [characterImageFailed, setCharacterImageFailed] = useState(false);
  const [weaponImageFailed, setWeaponImageFailed] = useState(false);
  const barWidthClass = isWuWa ? 'w-14' : 'w-12';
  const characterSizeClass = isWuWa ? 'w-24 h-24' : 'w-16 h-16';
  const weaponSizeClass = isWuWa ? 'w-16 h-16' : 'w-12 h-12';
  const weaponPaddingClass = isWuWa ? 'p-[5px]' : 'p-[4px]';
  const barAreaHeightClass = isWuWa ? 'h-[156px]' : 'h-[200px]';
  const labelWidthClass = isWuWa ? 'w-[96px]' : 'w-[84px]';
  const textBlockClass = isWuWa ? 'min-h-[40px]' : 'min-h-[44px]';
  const scaledShare = maxShare > 0 ? character.share / maxShare : 0;
  const wuwaBarScale = 0.82;
  const wuwaBarAreaHeight = 156;
  const wuwaWeaponSize = 64;
  const wuwaWeaponRadius = wuwaWeaponSize / 2;
  const wuwaMinWeaponBottom = 16;
  const wuwaMaxWeaponBottom = wuwaBarAreaHeight - wuwaWeaponSize - 10;
  const barHeightPercent = isWuWa
    ? Math.max(scaledShare * 100 * wuwaBarScale, 6)
    : Math.max(character.share, 2);
  const barHeightPx = isWuWa ? (barHeightPercent / 100) * wuwaBarAreaHeight : 0;
  const weaponBottom = isWuWa
    ? Math.min(Math.max(barHeightPx - wuwaWeaponRadius, wuwaMinWeaponBottom), wuwaMaxWeaponBottom)
    : Math.max(Math.max(character.share, 5), 18);

  useEffect(() => {
    setCharacterImageFailed(false);
  }, [charImg]);

  useEffect(() => {
    setWeaponImageFailed(false);
  }, [weaponImg]);

  return (
    <div
      className="flex flex-col items-center flex-1 h-full justify-end group min-w-0"
      style={isWuWa ? { minWidth: 96 } : undefined}
    >
      {isWuWa ? (
        <div className="h-8 mb-1 flex items-end justify-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-black leading-none"
            style={{ color: colors.accent }}
          >
            {character.share}%
          </motion.span>
        </div>
      ) : (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-black mb-1"
          style={{ color: colors.accent }}
        >
          {character.share}%
        </motion.span>
      )}

      <div className={`relative w-full flex flex-col items-center justify-end ${barAreaHeightClass}`}>
        <div
          className={`absolute z-20 ${weaponSizeClass} rounded-full border-2 overflow-hidden shadow-lg`}
          style={{
            borderColor: colors.accent,
            bottom: isWuWa ? `${weaponBottom}px` : `calc(${weaponBottom}% - 24px)`,
            backgroundColor: '#0f172a',
          }}
        >
          {weaponImg && !weaponImageFailed ? (
            <div className={`w-full h-full ${weaponPaddingClass}`}>
              <img
                src={weaponImg}
                alt={character.weaponName}
                className="w-full h-full object-contain"
                onError={() => setWeaponImageFailed(true)}
              />
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[10px]"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              ?
            </div>
          )}
        </div>

        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${barHeightPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`${barWidthClass} rounded-t-md relative overflow-hidden`}
          style={{
            backgroundColor: colors.primary,
            boxShadow: `0 0 20px ${colors.accent}44`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.2), rgba(0,0,0,0))',
            }}
          />
        </motion.div>
      </div>

      <div className={`${isWuWa ? 'mt-1' : 'mt-2'} relative`}>
        <motion.div
          whileHover={{ scale: isWuWa ? 1.06 : 1.1 }}
          className={`${characterSizeClass} rounded-full border-2 overflow-hidden shadow-xl z-10 relative`}
          style={{ borderColor: colors.accent, backgroundColor: '#1e293b' }}
        >
          {charImg && !characterImageFailed ? (
            <img
              src={charImg}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={() => setCharacterImageFailed(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[10px]"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              ?
            </div>
          )}
        </motion.div>

        <div
          className="absolute inset-0 rounded-full blur-md -z-10 opacity-50"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      <div className={`mt-1 text-center ${textBlockClass} flex flex-col items-center justify-start`}>
        <div
          className={`${isWuWa ? 'text-xs' : 'text-[11px]'} leading-tight font-black ${labelWidthClass} whitespace-normal break-words`}
          style={{ color: '#ffffff' }}
        >
          {character.name || 'Character'}
        </div>
        <div
          className={`${isWuWa ? 'text-[11px]' : 'text-[10px]'} uppercase tracking-wider font-bold mt-0.5`}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {character.role}
        </div>
      </div>
    </div>
  );
};
