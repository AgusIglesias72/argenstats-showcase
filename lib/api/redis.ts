// /lib/api/redis.ts
import { Redis } from "ioredis";

// Configurar Redis con tu URL de forma segura
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL no está definido en las variables de entorno");
}
const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

// Event listeners para debugging
redis.on("connect", () => {
  console.log("✅ Redis conectado");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

redis.on("ready", () => {
  console.log("✅ Redis ready to accept commands");
});

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as T;
    } catch (parseError) {
      console.error("Error parsing cached data:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds = 300
): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    await redis.set(key, serialized, "EX", ttlSeconds);
  } catch (error) {
    console.error("Redis set error:", error);
    // No lanzamos el error para que la app siga funcionando sin cache
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`
      );
    }
  } catch (error) {
    console.error("Redis invalidate error:", error);
  }
}
export async function getCacheStats() {
  try {
    const info = await redis.info("stats");
    const dbSize = await redis.dbsize();

    return {
      connected: redis.status === "ready",
      totalKeys: dbSize,
      info: info,
    };
  } catch (error) {
    return {
      connected: false,
      error: error,
    };
  }
}

export { redis };
