import client from './vitest.config';
export default {
  ...client,
  test: {
    ...client.test,
    environment: 'node',
    setupFiles: [],
    include: ['scripts/phonics-scene-audit.test.ts'],
  },
};
