import express from 'express';
import { deleteStoredTeam, ensureTeamsDir, getTeamsDir, readAllTeams, writeTeam } from './teamStore';

const app = express();
const port = Number(process.env.TEAM_API_PORT || 3001);

app.use(express.json({ limit: '10mb' }));

app.get('/api/teams', async (_req, res) => {
  try {
    res.json(await readAllTeams());
  } catch (error) {
    console.error('Failed to read saved teams:', error);
    res.status(500).json({ message: 'Failed to read saved teams.' });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  const team = req.body;
  const { id } = req.params;

  if (!team || typeof team !== 'object' || team.id !== id) {
    return res.status(400).json({ message: 'Invalid team payload.' });
  }

  try {
    await writeTeam(id, team);
    return res.status(204).send();
  } catch (error) {
    console.error('Failed to save team:', error);
    return res.status(500).json({ message: 'Failed to save team.' });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    await deleteStoredTeam(req.params.id);
    return res.status(204).send();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return res.status(204).send();
    }
    console.error('Failed to delete team:', error);
    return res.status(500).json({ message: 'Failed to delete team.' });
  }
});

ensureTeamsDir()
  .then(() => {
    app.listen(port, () => {
      console.log(`Team storage API running at http://localhost:${port}`);
      console.log(`Teams folder: ${getTeamsDir()}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize teams directory:', error);
    process.exit(1);
  });
