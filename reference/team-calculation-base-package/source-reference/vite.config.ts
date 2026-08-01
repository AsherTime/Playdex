import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  deleteStoredTeam,
  readAllTeams,
  writeTeam,
} from './server/teamStore';

const TEAMS_API_ROUTE = /^\/api\/teams(?:\/([^/?#]+))?$/;

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
};

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const sendNoContent = (res: ServerResponse): void => {
  res.statusCode = 204;
  res.end();
};

const createTeamsApiMiddleware = () => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const method = req.method || 'GET';
    const url = req.url || '';
    const match = TEAMS_API_ROUTE.exec(url);

    if (!match) {
      next();
      return;
    }

    const [, teamId] = match;

    try {
      if (method === 'GET' && !teamId) {
        sendJson(res, 200, await readAllTeams());
        return;
      }

      if (method === 'PUT' && teamId) {
        const team = await readJsonBody(req);
        if (!team || typeof team !== 'object' || (team as { id?: string }).id !== teamId) {
          sendJson(res, 400, { message: 'Invalid team payload.' });
          return;
        }

        await writeTeam(teamId, team);
        sendNoContent(res);
        return;
      }

      if (method === 'DELETE' && teamId) {
        try {
          await deleteStoredTeam(teamId);
        } catch (error: unknown) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }

        sendNoContent(res);
        return;
      }

      sendJson(res, 405, { message: 'Method not allowed.' });
    } catch (error) {
      console.error('Failed to handle teams API request in Vite:', error);
      sendJson(res, 500, { message: 'Failed to handle teams API request.' });
    }
  };
};

const folderBackedTeamsApiPlugin = (): Plugin => {
  const middleware = createTeamsApiMiddleware();

  return {
    name: 'folder-backed-teams-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss(), folderBackedTeamsApiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify-file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
