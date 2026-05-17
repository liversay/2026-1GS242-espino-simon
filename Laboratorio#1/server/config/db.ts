import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pollclass';

let connected = false;

export async function connectDB() {
  if (connected) return;
  
  try {
    await mongoose.connect(MONGODB_URI);
    connected = true;
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

export function isConnected() {
  return connected;
}
