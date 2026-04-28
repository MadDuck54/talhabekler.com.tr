import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: 'Talha Bekler — blog',
    description:
      'Notlar, denemeler ve üretim hatları. ERP, AI iş akışları, self-hosted altyapı ve endüstriyel donanım üzerine yazılar.',
    site: context.site!,
    customData: '<language>tr-TR</language>',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.lede ?? '',
      pubDate: p.data.date,
      link: `/blog/${p.id}`,
      categories: p.data.tags,
    })),
  });
}
