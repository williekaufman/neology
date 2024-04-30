import os
import redis as r
from typing import Optional, Any
import json

if os.environ.get('REDIS_URL'):
    # Use the Docker service name `redis` as the hostname.
    redis = r.Redis(connection_pool=r.ConnectionPool(host='redis', port=6379, db=0))
else:
    redis = r.Redis(connection_pool=r.ConnectionPool(host='localhost', port=6379, db=5))


def rget(key: str, username: Optional[int] = None) -> Optional[str]:
    key = f'neologisms:{key}'
    if username is not None:
        key = f"{key}:{username}"
    raw_result = redis.get(key)
    return raw_result.decode('utf-8') if raw_result is not None else None

def can_be_inted(x):
    try:
        int(x)
        return True
    except:
        return False

def jsonKeys2int(x):
    if isinstance(x, dict):
        return {int(k) if can_be_inted(k) else k:v for k,v in x.items()}
    return x

def rget_json(key: str, game_id: Optional[int] = None) -> Optional[Any]:
    raw_result = rget(key, game_id)
    return json.loads(raw_result, object_hook=jsonKeys2int) if raw_result is not None else None

def rset(key: str, value: Any, username: Optional[int] = None, ex: Optional[int] = None) -> None:
    key = f'neologisms:{key}'
    if username is not None:
        key = f"{key}:{username}"
        ex = 60*60*24*7
    redis.set(key, value, ex=ex)

def rset_json(key: str, value: Any, game_id: Optional[int] = None) -> None:
    rset(key, json.dumps(value), game_id)

# Returns false it not limited, or the time left if limited
def consume(key: str, limit: int, timeout: int) -> int:
    rget_key = rget(key)
    if rget_key is None:
        rset(key, 1, ex=timeout)
        return False
    if int(rget_key) < limit:
        redis.incr(key)
        return False
    return redis.ttl(key)