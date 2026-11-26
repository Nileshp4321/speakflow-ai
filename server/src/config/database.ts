import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  const safeUri = config.mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

  console.log(`[DB] Connecting to MongoDB…`);
  console.log(`[DB] URI: ${safeUri}`);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(`[DB] ✅ Connected to MongoDB successfully`);

    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected — queries will fail until reconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected');
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[DB] ❌ Failed to connect to MongoDB');
    console.error('[DB] Reason:', msg);
    console.error('[DB] Check:');
    console.error('  1. MONGODB_URI in server/.env is correct');
    console.error('  2. The password has no special characters that need URL-encoding');
    console.error('  3. Your IP is whitelisted in MongoDB Atlas → Network Access');
    console.error('  4. The cluster name and username are correct');
    // Exit so the problem is visible immediately rather than silently buffering
    process.exit(1);
  }
}
