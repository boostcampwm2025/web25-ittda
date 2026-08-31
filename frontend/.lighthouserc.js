module.exports = {
  ci: {
    collect: {
      // staticDistDir: '.next',
      startServerCommand: 'pnpm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      url: ['http://localhost:3000'],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
