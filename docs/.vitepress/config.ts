import { defineConfig } from 'vitepress';

/**
 * Lookout documentation.
 * Assets are files in this package. No remote fonts, scripts, or images.
 */
export default defineConfig({
  base: '/lookout/',
  cleanUrls: true,
  title: 'Lookout',
  description:
    'Web answers with source-level proof. Search and fetch citeable excerpts, no API key.',

  appearance: 'dark',
  lastUpdated: true,
  lang: 'en-US',

  vite: {
    build: {
      target: 'esnext',
    },
  },

  head: [
    ['meta', { name: 'theme-color', content: '#070b0c' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Lookout — web answers with source-level proof' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Search and fetch citeable excerpts. No API key.',
      },
    ],
    ['meta', { property: 'og:url', content: 'https://sylphxai.github.io/lookout/' }],
    ['meta', { property: 'og:site_name', content: 'Lookout' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'Lookout — web answers with source-level proof' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Search and fetch citeable excerpts. No API key.',
      },
    ],
    ['meta', { name: 'twitter:site', content: '@sylphxai' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'mcp, web search, web fetch, citations, excerpts, model context protocol, ai agent, claude, cursor, no api key',
      },
    ],
    ['meta', { name: 'author', content: 'Sylphx' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['link', { rel: 'canonical', href: 'https://sylphxai.github.io/lookout/' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/lookout/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Lookout',

    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'Tools', link: '/reference/tools' },
      { text: 'Compare', link: '/COMPETITIVE' },
    ],

    sidebar: [
      {
        text: 'Get started',
        items: [
          { text: 'Quickstart', link: '/guide/quickstart' },
          { text: 'Defaults', link: '/reference/defaults' },
        ],
      },
      {
        text: 'Tools',
        items: [
          { text: 'Tool surface', link: '/TOOL_SURFACE' },
          { text: 'Tool reference', link: '/reference/tools' },
        ],
      },
      {
        text: 'Product',
        items: [
          { text: 'Vision', link: '/vision' },
          { text: 'Capabilities', link: '/capabilities' },
          { text: 'Evidence contract', link: '/EVIDENCE_CONTRACT' },
          { text: 'Compare', link: '/COMPETITIVE' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SylphxAI/lookout' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@sylphx/lookout' },
    ],

    editLink: {
      pattern: 'https://github.com/SylphxAI/lookout/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'MIT licensed · search and fetch, no API key · these docs load no remote assets',
      copyright: 'Copyright 2026 Sylphx',
    },

    outline: { level: [2, 3] },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
  },
});
