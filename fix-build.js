const fs = require('fs');
const path = require('path');
const {  spawn } = require('child_process');

// Watch .next/server directory and recreate pages-manifest.json if missing
const serverDir = path.join(__dirname, '.next', 'server');
const pagesManifestPath = path.join(serverDir, 'pages-manifest.json');

// Create watcher process
function watchAndFix() {
  if (fs.existsSync(serverDir)) {
    if (!fs.existsSync(pagesManifestPath)) {
      fs.writeFileSync(pagesManifestPath, JSON.stringify({}, null, 2));
      console.log('[FIX] Created missing pages-manifest.json');
    }
  }
}

// Run every 100ms during build
const interval = setInterval(watchAndFix, 100);

// Start the actual Next.js build
const buildProcess = spawn('npx', ['next', 'build'], {
  env: { ...process.env, SKIP_ENV_VALIDATION: 'true' },
  stdio: 'inherit',
  shell: true
});

buildProcess.on('exit', (code) => {
  clearInterval(interval);
  process.exit(code);
});

buildProcess.on('error', (err) => {
  clearInterval(interval);
  console.error('Build process error:', err);
  process.exit(1);
});
