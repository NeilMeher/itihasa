import { defineConfig } from '@playwright/test';

const port = Number(process.env.ITIHASA_QA_PORT ?? '4321');
const baseURL = `http://127.0.0.1:${port}`;
const python = process.env.ITIHASA_PYTHON
  ? `"${process.env.ITIHASA_PYTHON}"`
  : 'uv run --locked --project research python';
const output = process.env.ITIHASA_QA_DIST ? ` --dist "${process.env.ITIHASA_QA_DIST}"` : '';

export default defineConfig({
  testDir: './apps/web/tests',
  use: { baseURL },
  webServer: {
    command: `${python} research/serve_beta.py --port ${port}${output}`,
    url: baseURL,
  },
});
