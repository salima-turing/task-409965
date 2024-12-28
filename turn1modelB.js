const rateLimit = {
    tokensPerSecond: 100,
    bucketSize: 1000
};

const redisClient = require('redis').createClient();

async function getTokens(key) {
    try {
        const tokens = await redisClient.getAsync(key);
        return tokens ? parseInt(tokens) : 0;
    } catch (error) {
        console.error('Error getting tokens:', error);
        return 0;
    }
}

async function setTokens(key, tokens) {
    try {
        await redisClient.setexAsync(key, rateLimit.bucketSize, tokens);
    } catch (error) {
        console.error('Error setting tokens:', error);
    }
// }


async function rateLimitRequest(req, res) {
    const ip = req.ip || 'unknown';
    const key = `rate_limit:${ip}`;

    try {
        // Get the current number of tokens in the bucket
        const currentTokens = await getTokens(key);

        // If the bucket is empty, rate limit the request
        if (currentTokens === 0) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }

        // Consume a token from the bucket
        const remainingTokens = currentTokens - 1;
        await setTokens(key, remainingTokens);

        // Add a token to the bucket at the rate limit frequency
        setTimeout(async () => {
            const newTokens = Math.min(rateLimit.bucketSize, remainingTokens + rateLimit.tokensPerSecond);
            await setTokens(key, newTokens);
        }, 1000);

        return res.json({ message: 'Request successful' });
    } catch (error) {
        console.error('Error rate limiting request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
