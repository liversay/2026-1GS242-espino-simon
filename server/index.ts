import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { connectDB } from './config/db';
import polls from './routes/polls';
import votes from './routes/votes';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));

app.get('/', (c) => c.json({ message: 'PollClass API', status: 'running' }));

app.route('/api/polls', polls);
app.route('/api', votes);

const PORT = parseInt(process.env.PORT || '3001');

async function start() {
  await connectDB();
  
  serve({
    fetch: app.fetch,
    port: PORT
  });
  
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
}

start().catch(console.error);
