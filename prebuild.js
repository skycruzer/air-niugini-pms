const fs = require('fs');
const path = require('path');

// Ensure .next/server directory exists and has required manifest files
const serverDir = path.join(__dirname, '.next', 'server');
const pagesManifestPath = path.join(serverDir, 'pages-manifest.json');
const middlewareManifestPath = path.join(serverDir, 'middleware-manifest.json');

// Create directories
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
  console.log('Created .next/server directory');
}

// Create empty pages-manifest.json if it doesn't exist
if (!fs.existsSync(pagesManifestPath)) {
  fs.writeFileSync(pagesManifestPath, JSON.stringify({}, null, 2));
  console.log('Created empty pages-manifest.json');
}

// Create minimal middleware-manifest.json if it doesn't exist  
if (!fs.existsSync(middlewareManifestPath)) {
  const middlewareManifest = {
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    version: 2
  };
  fs.writeFileSync(middlewareManifestPath, JSON.stringify(middlewareManifest, null, 2));
  console.log('Created minimal middleware-manifest.json');
}

console.log('Pre-build setup complete');
