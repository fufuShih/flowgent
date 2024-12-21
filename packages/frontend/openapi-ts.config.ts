import { defaultPlugins, defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3004/api-docs.json',
  output: 'src/openapi-client',
  plugins: [
    ...defaultPlugins,
    {
      dates: true,
      name: '@hey-api/transformers',
    },
  ],
});
