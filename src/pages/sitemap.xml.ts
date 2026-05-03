import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE_URL } from '../lib/identity';

export const prerender = true;

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

export async function GET(_ctx: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  // ana sayfa lastmod = en son güncellenen post (yoksa build time)
  const allDates = posts.map((p) => (p.data.updated ?? p.data.date).getTime());
  const newest = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();
  const newestStr = fmtDate(newest);

  type Entry = {
    loc: string;
    lastmod: string;
    priority: number;
    alternates?: Array<{ hreflang: string; href: string }>;
  };

  const entries: Entry[] = [
    { loc: SITE_URL, lastmod: newestStr, priority: 1.0 },
    { loc: `${SITE_URL}/blog`, lastmod: newestStr, priority: 0.9 },
  ];

  for (const p of posts) {
    const lastmod = fmtDate(p.data.updated ?? p.data.date);
    const lang = p.data.lang ?? 'tr';
    const url = `${SITE_URL}/blog/${p.id}`;

    let alternates: Entry['alternates'];
    if (p.data.translations && Object.keys(p.data.translations).length > 0) {
      alternates = [{ hreflang: lang, href: url }];
      for (const [code, slug] of Object.entries(p.data.translations)) {
        const target = posts.find((q) => q.id === slug);
        if (target) {
          alternates.push({ hreflang: code, href: `${SITE_URL}/blog/${target.id}` });
        }
      }
      // x-default = TR varsa TR, yoksa self
      const tr = alternates.find((a) => a.hreflang === 'tr');
      alternates.push({ hreflang: 'x-default', href: tr?.href ?? url });
    }

    entries.push({ loc: url, lastmod, priority: 0.8, alternates });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((e) => {
      const parts = [
        `<url>`,
        `<loc>${e.loc}</loc>`,
        `<lastmod>${e.lastmod}</lastmod>`,
        `<priority>${e.priority.toFixed(1)}</priority>`,
      ];
      if (e.alternates) {
        for (const alt of e.alternates) {
          parts.push(`<xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`);
        }
      }
      parts.push(`</url>`);
      return parts.join('');
    }),
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
