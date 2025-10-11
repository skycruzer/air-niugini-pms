const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure manifests exist before starting
function ensureManifests() {
  const serverDir = path.join(__dirname, '.next', 'server');
  const pagesManifestPath = path.join(serverDir, 'pages-manifest.json');
  const middlewareManifestPath = path.join(serverDir, 'middleware-manifest.json');

  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  if (!fs.existsSync(pagesManifestPath)) {
    fs.writeFileSync(pagesManifestPath, JSON.stringify({}, null, 2));
  }

  if (!fs.existsSync(middlewareManifestPath)) {
    const middlewareManifest = {
      sortedMiddleware: [],
      middleware: {},
      functions: {},
      version: 2
    };
    fs.writeFileSync(middlewareManifestPath, JSON.stringify(middlewareManifest, null, 2));
  }
}

// Run initial setup
ensureManifests();

// Watch and recreate manifests every 500ms during dev
const watchInterval = setInterval(() => {
  ensureManifests();
}, 500);

// Start Next.js dev server
const devProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devProcess.on('exit', (code) => {
  clearInterval(watchInterval);
  process.exit(code);
});

devProcess.on('error', (err) => {
  clearInterval(watchInterval);
  console.error('Dev server error:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => {
  clearInterval(watchInterval);
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  clearInterval(watchInterval);
  devProcess.kill('SIGTERM');
});
