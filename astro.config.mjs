// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://talhabekler.com.tr',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: false,
    },
  },
});
