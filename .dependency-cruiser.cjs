/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-client-in-server',
      severity: 'error',
      from: { path: '^(apps/game-server|src/server|packages)' },
      to: { path: 'src/client' },
    },
    {
      name: 'packages-no-apps',
      severity: 'error',
      from: { path: '^packages' },
      to: { path: '^(apps|src/client|src/server)' },
    },
    {
      name: 'engine-no-network',
      severity: 'error',
      from: { path: '^packages/engine' },
      to: { path: '^packages/network' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
