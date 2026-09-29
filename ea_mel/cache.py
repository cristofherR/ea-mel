"""cache.py — caché TTL mínimo en memoria para respuestas de solo lectura."""
import time

_store = {}


def cached(ttl):
    def deco(fn):
        def wrap(*args, **kwargs):
            key = (fn.__name__, args, tuple(sorted(kwargs.items())))
            now = time.time()
            hit = _store.get(key)
            if hit and now - hit[0] < ttl:
                return hit[1]
            val = fn(*args, **kwargs)
            _store[key] = (now, val)
            return val
        return wrap
    return deco
