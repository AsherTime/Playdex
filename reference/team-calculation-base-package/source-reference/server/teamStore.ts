import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const teamsDir = path.resolve(projectRoot, 'saved-teams');

const isTeamFile = (fileName: string) => fileName.endsWith('.json');

export const getTeamsDir = (): string => teamsDir;

export const getTeamPath = (id: string): string => path.join(teamsDir, `${id}.json`);

export const ensureTeamsDir = async (): Promise<void> => {
  await fs.mkdir(teamsDir, { recursive: true });
};

export const readAllTeams = async (): Promise<unknown[]> => {
  await ensureTeamsDir();
  const files = (await fs.readdir(teamsDir)).filter(isTeamFile);
  return Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(teamsDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    })
  );
};

export const writeTeam = async (id: string, team: unknown): Promise<void> => {
  await ensureTeamsDir();
  await fs.writeFile(getTeamPath(id), JSON.stringify(team, null, 2), 'utf-8');
};

export const deleteStoredTeam = async (id: string): Promise<void> => {
  await fs.unlink(getTeamPath(id));
};
