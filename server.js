// Simple localhost-only Express server for the bench sales tool
// Serves static frontend files only. Form submits directly to n8n webhook.

const express = require('express');
const path = require('path');

const app = express();
const HOST = '127.0.0.1';
const PORT = 3000;

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Start server, bound to localhost only
app.listen(PORT, HOST, () => {
  console.log(`Bench sales tool server running at http://${HOST}:${PORT}`);
});

