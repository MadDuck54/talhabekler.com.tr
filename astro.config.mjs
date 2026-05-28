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
      // çift tema: token renkleri --shiki-light / --shiki-dark CSS değişkenleri
      // olarak gömülür; hangisinin uygulanacağını global.css data-theme'e göre seçer
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
      defaultColor: false,
      wrap: false,
    },
  },
});
