import type { APIContext } from 'astro';
import { renderOg } from '../../lib/og';

export const prerender = true;

export async function GET(_ctx: APIContext) {
  const png = await renderOg({
    breadcrumb: 'cv/talha-bekler',
    meta: [
      ['belge', 'CV—001'],
      ['tarih', '2026·04·26'],
      ['durum', 'aktif'],
    ],
    title: 'AI iş akışları ve iç sistemler',
    lede:
      'Üretim ve operasyon işletmeleri için iç araçlar yazıyorum. ERP/MES, depo yönetim, ajan orkestrasyonu, self-hosted altyapı.',
    footTags: 'laravel · vue · astro · linux',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
