import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// In production we never want mongoose to auto-build indexes on every cold start —
// that can stall the first request for several seconds. Build indexes once via a
// migration / one-off script instead.
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
mongoose.set('strictQuery', true);

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache || {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectDB() {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Fast-fail instead of the 30s default when DNS / cluster is unreachable
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 5000,
        // Reuse a small pool — serverless instances are short-lived
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        // Don't queue commands while disconnected — fail fast
        bufferCommands: false,
        // Faster handshake
        family: 4,
        compressors: ['zlib'],
      })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
