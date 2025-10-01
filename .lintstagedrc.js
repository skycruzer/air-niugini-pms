module.exports = {
  // Run Prettier on all supported file types
  '*.{js,jsx,ts,tsx,json,css,scss,md,yaml,yml}': ['prettier --write'],

  // Run ESLint on JavaScript/TypeScript files with auto-fix
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],

  // Run type-check on TypeScript files (without emitting)
  '*.{ts,tsx}': () => 'npm run type-check',

  // Run tests related to staged files (optional - can be slow)
  // Uncomment if you want to run tests on commit
  // '*.{ts,tsx}': ['npm run test:related --'],
};
