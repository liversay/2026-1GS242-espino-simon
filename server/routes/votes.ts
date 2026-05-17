import { Hono } from 'hono';
import { Poll } from '../models/Poll';
import { Vote } from '../models/Vote';

const votes = new Hono();

votes.post('/polls/:id/vote', async (c) => {
  try {
    const pollId = c.req.param('id');
    const { optionIndex, voterName } = await c.req.json();

    if (optionIndex === undefined || !voterName) {
      return c.json({ error: 'optionIndex y voterName requeridos' }, 400);
    }

    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    if (poll.status === 'closed') {
      return c.json({ error: 'La encuesta está cerrada' }, 400);
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return c.json({ error: 'Índice de opción inválido' }, 400);
    }

    const existingVote = await Vote.findOne({ pollId, voterName });
    if (existingVote) {
      return c.json({ error: 'Ya has votado en esta encuesta' }, 409);
    }

    const vote = new Vote({ pollId, optionIndex, voterName });
    await vote.save();

    poll.options[optionIndex].votes += 1;
    await poll.save();

    return c.json({ message: 'Voto registrado', vote }, 201);
  } catch (error) {
    console.error('Error votando:', error);
    return c.json({ error: 'Error registrando voto' }, 500);
  }
});

export default votes;
