import { Redis } from '@upstash/redis';

// In-memory fallback for local testing (no Redis)
const memoryStore = new Map();
let useMemory = false;

let redis = null;
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 10 * 60;

// Try to initialize Redis, fall back to memory if env vars missing
try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log('[store] Redis env vars not found, using in-memory store (WARNING: data lost on restart)');
    useMemory = true;
  } else {
    redis = Redis.fromEnv();
    console.log('[store] Redis client initialized');
  }
} catch (err) {
  console.log('[store] Redis initialization failed, using in-memory store:', err.message);
  useMemory = true;
}

export async function getSession(sessionId) {
  try {
    if (useMemory) {
      const key = `${SESSION_PREFIX}${sessionId}`;
      const data = memoryStore.get(key);
      if (!data) return null;
      // Check TTL
      if (data.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
      }
      return data.value;
    }

    const key = `${SESSION_PREFIX}${sessionId}`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    // Upstash returns string or already-parsed object
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  } catch (err) {
    console.error(`Error getting session ${sessionId}:`, err.message || err);
    return null;
  }
}

export async function setSession(sessionId, data) {
  try {
    const expiresAt = Date.now() + SESSION_TTL * 1000;
    const content = JSON.stringify(data);

    if (useMemory) {
      const key = `${SESSION_PREFIX}${sessionId}`;
      memoryStore.set(key, {
        value: data,
        expiresAt,
      });
      return true;
    }

    const key = `${SESSION_PREFIX}${sessionId}`;
    await redis.set(key, content, {
      ex: SESSION_TTL,
    });
    return true;
  } catch (err) {
    console.error(`Error setting session ${sessionId}:`, err.message || err);
    return false;
  }
}

export async function deleteSession(sessionId) {
  try {
    if (useMemory) {
      const key = `${SESSION_PREFIX}${sessionId}`;
      memoryStore.delete(key);
      return true;
    }

    const key = `${SESSION_PREFIX}${sessionId}`;
    await redis.delete(key);
    return true;
  } catch (err) {
    console.error(`Error deleting session ${sessionId}:`, err.message || err);
    return false;
  }
}
