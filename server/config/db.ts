import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.ts';

let memoryServer: MongoMemoryServer | null = null;
let connectionMode: 'external' | 'embedded' = 'external';

export function getDatabaseMode(): 'external' | 'embedded' {
  return connectionMode;
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  mongoose.set('strictQuery', true);

  if (env.mongoUri) {
    connectionMode = 'external';
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[db] Connected to MongoDB via MONGODB_URI');
    return mongoose;
  }

  connectionMode = 'embedded';
  const dbPath = path.resolve(process.cwd(), '.data', 'mongodb');
  fs.mkdirSync(dbPath, { recursive: true });

  try {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'skillproof',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
  } catch {
    // Fallback to ephemeral in-memory instance if wiredTiger lock or filesystem restricts dbPath
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'skillproof',
      },
    });
  }

  const uri = memoryServer.getUri('skillproof');
  await mongoose.connect(uri);
  console.log('[db] Connected to embedded MongoDB instance (MONGODB_URI not set)');
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
