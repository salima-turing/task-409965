const express = require('express');

const app = express();
const PORT = 4000;

// Define the leaky bucket parameters
const BUCKET_CAPACITY = 10; // Maximum capacity of the bucket
const LEAK_RATE = 1; // Number of requests to allow per second

// Initialize the leaky bucket state
let currentWaterLevel = 0; // Current level of water (requests in the bucket)
let lastLeakTime = Date.now(); // Last time the bucket leaked

// Function to manage the leaking of the bucket
const leakBucket = () => {
    const now = Date.now();
    // Calculate how many seconds have passed since the last leak
    const elapsedTime = (now - lastLeakTime) / 1000;

    // Calculate how much water (requests) should have leaked out
    const leakedWater = elapsedTime * LEAK_RATE;

    // Update the current water level
    currentWaterLevel = Math.max(0, currentWaterLevel - leakedWater);
    lastLeakTime = now; // Update the last leak time
};

// Middleware for rate limiting using the leaky bucket algorithm
const leakyBucketRateLimit = (req, res, next) => {
    // Leak requests from the bucket before allowing a new request
    leakBucket();

    // Check if we have space in the bucket for the new request
    if (currentWaterLevel < BUCKET_CAPACITY) {
        // If there's space, allow the new request
        currentWaterLevel++;
        next(); // Proceed to the next middleware or route handler
    } else {
        // If the bucket is full, reject the request
        res.status(429).send('Too many requests! Please try again later.');
    }
};

// Use the leaky bucket rate limiting middleware in the application
app.use(leakyBucketRateLimit);

// Sample route
app.get('/api/data', (req, res) => {
    res.send('Data accessed successfully!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
