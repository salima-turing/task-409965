const Queue = require('collections/queue');

class LeakyBucket {
    constructor(capacity, rate) {
        this.capacity = capacity; // Maximum number of requests the bucket can hold
        this.rate = rate; // Number of requests per second
        this.queue = new Queue();
        this.nextCheckTime = Date.now() + (1000 / this.rate); // Time for next bucket check
    }

    // Add a new request to the queue
    async addRequest() {
        while (this.queue.size >= this.capacity) {
            // If bucket is full, wait until some space is available
            const timeToWait = this.nextCheckTime - Date.now();
            if (timeToWait > 0) {
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }
        }

        this.queue.enqueue(true);
        this.checkBucket();
    }

    // Process requests periodically at the set rate
    checkBucket() {
        const now = Date.now();
        if (now >= this.nextCheckTime) {
            const numRequestsToProcess = Math.min(this.queue.size, this.rate);
            for (let i = 0; i < numRequestsToProcess; i++) {
                this.queue.dequeue();
            }

            this.nextCheckTime = now + (1000 / this.rate);
            // Recursively call to check the bucket at the next interval
            setTimeout(this.checkBucket.bind(this), 0);
        }
    }
}

// Usage example
const express = require('express');
const app = express();

const leakyBucket = new LeakyBucket(5, 1); // Bucket capacity 5, rate 1 request per second

// Middleware for rate limiting using leaky bucket
const rateLimit = (req, res, next) => {
    leakyBucket.addRequest().then(() => {
        next();
    }).catch((error) => {
        console.error('Error adding request to leaky bucket:', error);
        res.status(500).send('Internal Server Error');
    });
};

app.use(rateLimit);

app.get('/api/data', (req, res) => {
    res.send('Data accessed successfully!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
