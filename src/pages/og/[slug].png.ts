import { getCollection } from 'astro:content';
import type { APIContext, GetStaticPaths } from 'astro';
import { renderOg } from '../../lib/og';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  const asc = [...all].sort(
    (a, b) => a.data.date.getTime() - b.data.date.getTime(),
  );
  return asc.map((entry, i) => ({
    params: { slug: entry.id },
    props: {
      entry,
      docNumber: entry.data.docNumber ?? i + 1,
    },
  }));
};

const fmtDate = (d: Date) =>
  `${d.getFullYear()}·${String(d.getMonth() + 1).padStart(2, '0')}·${String(d.getDate()).padStart(2, '0')}`;

const truncate = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…';

export async function GET(ctx: APIContext) {
  const { entry, docNumber } = ctx.props as {
    entry: any;
    docNumber: number;
  };
  const docNo = String(docNumber).padStart(3, '0');
  const wordCount = entry.body?.split(/\s+/).filter(Boolean).length ?? 0;
  const readMin = Math.max(1, Math.round(wordCount / 200));

  const png = await renderOg({
    breadcrumb: `blog/talha-bekler/${entry.id}`,
    meta: [
      ['belge', `BLOG—${docNo}`],
      ['tarih', fmtDate(entry.data.date)],
      ['okuma', `${readMin} dk`],
    ],
    title: entry.data.title,
    lede: truncate(entry.data.lede ?? '', 140),
    footTags: entry.data.tags.join(' · '),
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
