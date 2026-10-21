-- Atomic Token Bucket Rate Limiter in Redis Lua
-- KEYS[1]: Rate limit key (e.g. rate:tenant:agent:endpoint)
-- ARGV[1]: Max capacity (tokens)
-- ARGV[2]: Refill rate (tokens per second)
-- ARGV[3]: Requested tokens (usually 1)
-- ARGV[4]: Current timestamp (epoch seconds as float)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

-- Retrieve current bucket state: {tokens, last_updated}
local state = redis.call("HMGET", key, "tokens", "last_updated")
local tokens = tonumber(state[1])
local last_updated = tonumber(state[2])

if tokens == nil then
    tokens = capacity
    last_updated = now
else
    -- Compute replenished tokens since last access
    local delta = math.max(0, now - last_updated)
    tokens = math.min(capacity, tokens + (delta * refill_rate))
    last_updated = now
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call("HMSET", key, "tokens", tokens, "last_updated", last_updated)
    -- Expire bucket after time needed to fully refill to avoid orphaned keys
    local ttl = math.ceil(capacity / refill_rate) * 2
    redis.call("EXPIRE", key, math.max(60, ttl))
    -- Return 1 (Allowed), remaining tokens, retry_after (0)
    return {1, tokens, 0}
else
    -- Rejected: calculate time to refill required tokens
    local needed = requested - tokens
    local retry_after = math.ceil(needed / refill_rate)
    redis.call("HMSET", key, "tokens", tokens, "last_updated", last_updated)
    return {0, tokens, retry_after}
end
