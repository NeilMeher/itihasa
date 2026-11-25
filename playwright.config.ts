import { defineConfig } from '@playwright/test';

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './apps/web/tests',
  use: { baseURL },
  webServer: {
    command: `npm run preview --workspace @itihasa/web -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
  },
});
