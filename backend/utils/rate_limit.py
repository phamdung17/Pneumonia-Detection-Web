from __future__ import annotations

from collections import defaultdict, deque
from time import time

try:
    import redis
except Exception:
    redis = None

from backend.config import get_settings
from backend.utils.errors import RateLimitAppError


settings = get_settings()


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self.buckets: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = time()
        bucket = self.buckets[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = max(1, int(window_seconds - (now - bucket[0])))
            return False, retry_after
        bucket.append(now)
        return True, 0


memory_limiter = InMemoryRateLimiter()
redis_client = None
if redis is not None:
    try:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    except Exception:
        redis_client = None


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    if redis_client is not None:
        now = int(time())
        cutoff = now - window_seconds
        try:
            pipe = redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, cutoff)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window_seconds)
            _, current, _, _ = pipe.execute()
            if int(current) >= limit:
                raise RateLimitAppError('Vuot qua gioi han tan suat', 60)
            return
        except RateLimitAppError:
            raise
        except Exception:
            pass
    allowed, retry_after = memory_limiter.hit(key, limit, window_seconds)
    if not allowed:
        raise RateLimitAppError('Vuot qua gioi han tan suat', retry_after)
