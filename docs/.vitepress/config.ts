import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Lookout',
  description: 'Web research with source-level proof',
  head: [
    ['link', { rel: 'canonical', href: 'https://sylphxai.github.io/lookout/' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Lookout — Web research with source-level proof' }],
    ['meta', { property: 'og:description', content: 'Search, fetch, extract, cache, compare, and research with citeable excerpts.' }],
    ['meta', { property: 'og:url', content: 'https://sylphxai.github.io/lookout/' }],
    ['meta', { name: 'twitter:card', content: 'summary' }]
  ],
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Quickstart', link: '/guide/quickstart' },
      { text: 'Tools', link: '/reference/tools' },
      { text: 'GitHub', link: 'https://github.com/SylphxAI/lookout' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@sylphx/lookout' }
    ],
    sidebar: [
      { text: 'Guide', items: [{ text: 'Quickstart', link: '/guide/quickstart' }, { text: 'Predictable defaults', link: '/reference/defaults' }] },
      { text: 'Reference', items: [{ text: 'Tools', link: '/reference/tools' }] }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/SylphxAI/lookout' }],
    footer: { message: 'Lookout · local-first agent tooling · MIT' }
  }
})
