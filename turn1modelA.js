const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
    url: process.env.REDIS_URL,
});
const incrAsync = promisify(client.incr).bind(client);
const ttlAsync = promisify(client.expire).bind(client);

const RATE_LIMIT = 5; // Max 5 requests
const TIME_FRAME = 60; // Per 60 seconds

// Middleware for rate limiting
const rateLimit = async (req, res, next) => {
    const key = `rate_limit:${req.ip}`; // Identify user by their IP

    try {
        const currentTokenCount = await incrAsync(key);

        if (currentTokenCount === 1) {
            // Set expiry for the first request
            await ttlAsync(key, TIME_FRAME);
        }

        if (currentTokenCount > RATE_LIMIT) {
            return res.status(429).send('Too many requests, please try again later.');
        }

        // If within limits, proceed with request
        next();

    } catch (error) {
        console.error('Error in rate limiting:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Usage with Express
const express = require('express');
const app = express();

app.use(rateLimit);
app.get('/api/data', (req, res) => {
    res.send('Data accessed successfully!');
});

// Start the server
app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
