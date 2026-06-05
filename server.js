// Simple Express server for the bench sales tool
// Serves static frontend files only. Form submits directly to n8n webhook.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bench sales tool server running on port ${PORT}`);
});
