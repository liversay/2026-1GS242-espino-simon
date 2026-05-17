import { Hono } from 'hono';
import { Poll } from '../models/Poll';
import { Vote } from '../models/Vote';

const polls = new Hono();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueCode(): Promise<string> {
  let code = generateCode();
  while (await Poll.findOne({ code })) {
    code = generateCode();
  }
  return code;
}

polls.post('/', async (c) => {
  try {
    const { title, options } = await c.req.json();
    
    if (!title || !options || options.length < 2) {
      return c.json({ error: 'Título y al menos 2 opciones requeridos' }, 400);
    }

    const code = await getUniqueCode();
    
    const poll = new Poll({
      title,
      options: options.map((text: string) => ({ text, votes: 0 })),
      status: 'active',
      code
    });

    await poll.save();
    return c.json(poll, 201);
  } catch (error) {
    console.error('Error creando poll:', error);
    return c.json({ error: 'Error creando encuesta' }, 500);
  }
});

polls.get('/', async (c) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    return c.json(polls);
  } catch (error) {
    console.error('Error getting polls:', error);
    return c.json({ error: 'Error obteniendo encuestas' }, 500);
  }
});

polls.get('/code/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase();
    const poll = await Poll.findOne({ code });
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    const voteCount = await Vote.countDocuments({ pollId: poll._id });
    
    return c.json({ ...poll.toObject(), voteCount });
  } catch (error) {
    console.error('Error getting poll by code:', error);
    return c.json({ error: 'Error obteniendo encuesta' }, 500);
  }
});

polls.get('/:id/results', async (c) => {
  try {
    const poll = await Poll.findById(c.req.param('id'));
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    const votes = await Vote.find({ pollId: poll._id });
    
    return c.json({
      _id: poll._id,
      title: poll.title,
      options: poll.options,
      status: poll.status,
      code: poll.code,
      totalVotes: votes.length,
      votes: votes.map(v => ({ voterName: v.voterName, optionIndex: v.optionIndex }))
    });
  } catch (error) {
    console.error('Error getting results:', error);
    return c.json({ error: 'Error obteniendo resultados' }, 500);
  }
});

polls.get('/:id', async (c) => {
  try {
    const poll = await Poll.findById(c.req.param('id'));
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    const votes = await Vote.find({ pollId: poll._id });
    
    return c.json({ ...poll.toObject(), votes });
  } catch (error) {
    console.error('Error getting poll:', error);
    return c.json({ error: 'Error obteniendo encuesta' }, 500);
  }
});

polls.patch('/:id/close', async (c) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      c.req.param('id'),
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    return c.json(poll);
  } catch (error) {
    console.error('Error closing poll:', error);
    return c.json({ error: 'Error cerrando encuesta' }, 500);
  }
});

polls.delete('/:id', async (c) => {
  try {
    const poll = await Poll.findByIdAndDelete(c.req.param('id'));
    
    if (!poll) {
      return c.json({ error: 'Encuesta no encontrada' }, 404);
    }

    await Vote.deleteMany({ pollId: poll._id });

    return c.json({ message: 'Encuesta eliminada' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return c.json({ error: 'Error eliminando encuesta' }, 500);
  }
});

export default polls;
