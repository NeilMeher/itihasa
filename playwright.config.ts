import { defineConfig } from '@playwright/test';

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;
const python = process.env.ITIHASA_PYTHON
  ? `"${process.env.ITIHASA_PYTHON}"`
  : 'uv run --locked --project research python';

export default defineConfig({
  testDir: './apps/web/tests',
  use: { baseURL },
  webServer: {
    command: `${python} research/serve_beta.py --port ${port}`,
    url: baseURL,
  },
});
