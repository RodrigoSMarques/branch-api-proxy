require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000; // Or any preferred port

const branchApiBaseUrliOS = 'https://api3.branch.io/';
const branchApiBaseUrlAndroid = 'https://api2.branch.io/';

// Load allowed Branch.io keys from environment variables
// It expects a comma-separated string, e.g., "key1,key2,key3"
const ALLOWED_BRANCH_KEYS_STRING = process.env.ALLOWED_BRANCH_KEYS || '';
const ALLOWED_BRANCH_KEYS = ALLOWED_BRANCH_KEYS_STRING.split(',').map(key => key.trim()).filter(key => key.length > 0);

if (ALLOWED_BRANCH_KEYS.length === 0) {
    console.warn('WARNING: No allowed Branch keys configured in ALLOWED_BRANCH_KEYS environment variable. All requests will be blocked.');
} else {
    console.log('Allowed Branch Keys:', ALLOWED_BRANCH_KEYS);
}

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse urlencoded request bodies (if necessary)
app.use(express.urlencoded({ extended: true }));

// Dynamic endpoint for your bridge at the root
// The '*' captures everything that comes after the domain, including the root itself.
// For example: /, /v1/url, /v2/event/custom, etc.

app.all(/^(\/.+|(?!\/).*)$/, async (req, res) => { // Using app.all to handle any HTTP method (GET, POST, PUT, DELETE, etc.)

    // --- START Branch Key Validation ---
    const incomingBranchKey = req.body.branch_key;
    const deviceOs = req.body.os;

    if (!ALLOWED_BRANCH_KEYS.includes(incomingBranchKey)) {
        console.warn(`[Proxy-Auth] Request to ${req.path} denied: Invalid 'branch_key' "${incomingBranchKey}".`);
        return res.status(403).json({ message: 'Authentication failed: Provided "branch_key" is not allowed.' });
    }

    console.log(`[Proxy-Auth] Valid 'branch_key' "${incomingBranchKey}" received for ${req.path}. Proceeding.`);

    // req.params[0] will contain the entire path after the root (e.g., 'v1/url' for /v1/url)
    const branchApiPath = req.params[0].substring(1);

    if (deviceOs.toUpperCase() == `IOS`) {
        const targetUrl = `${branchApiBaseUrliOS}${branchApiPath}`;
    } else {
        const targetUrl = `${branchApiBaseUrlAndroid}${branchApiPath}`;
    }
    
    console.log(`Request received at path: /${branchApiPath}`);
    console.log('Redirecting to:', targetUrl);
    console.log('Request body:', req.body);
    console.log('Original HTTP method:', req.method);
    console.log(`[Proxy] Request query parameters:`, req.query);
    // console.log('Original headers:', req.headers); // Uncomment to see full headers

    try {
        // Prepare headers for the request to Branch.io
        const headersToSend = { ...req.headers };
        // Remove headers that should not be forwarded to the downstream service
        delete headersToSend.host;
        delete headersToSend.connection;
        delete headersToSend['content-length']; // Axios recalculates this automatically
        // Express/Node.js specific headers that might cause issues or are irrelevant
        delete headersToSend['accept-encoding'];
        delete headersToSend['user-agent'];
        // Add other headers that the Branch.io API might require, e.g.:
        // headersToSend['Authorization'] = `Bearer YOUR_TOKEN_HERE`;

        const branchResponse = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body, // For POST/PUT, sends the original request body
            params: req.query, // For GET, sends the original query string parameters
            headers: headersToSend,
            // Allows axios to not throw an error for status codes > 2xx
            validateStatus: function (status) {
                return true; // Always resolve, reject only on network errors.
            }
        });

        console.log('Response received from Branch.io. Status:', branchResponse.status);
        // console.log('Response data:', branchResponse.data); // Uncomment to see response data

        // Return the Branch.io response to the original client
        // Copy Branch.io response headers to your response
        for (const header in branchResponse.headers) {
            // Avoid copying headers that are controlled by Express or HTTP in general
            if (!['transfer-encoding', 'connection', 'content-length'].includes(header.toLowerCase())) {
                res.setHeader(header, branchResponse.headers[header]);
            }
        }
        res.status(branchResponse.status).send(branchResponse.data);

    } catch (error) {
        console.error('Error calling Branch.io API:', error.message);
        if (error.response) {
            console.error('Branch.io error data:', error.response.data);
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            console.error('No response received from Branch.io');
            res.status(500).send({ message: 'No response received from Branch.io API or network error.' });
        } else {
            console.error('Error setting up request to Branch.io:', error.message);
            res.status(500).send({ message: 'Internal error processing request to Branch.io.' });
        }
    }
});


// Starts the server
app.listen(port, () => {
    console.log(`Branch.io API Bridge running on http://localhost:${port}`);
    console.log(`Dynamic endpoint available directly at the root: http://localhost:${port}/<any-branch-api-path>`);
});