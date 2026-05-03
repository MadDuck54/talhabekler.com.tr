import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Astro build process.cwd() = proje root; bundle edildikten sonra import.meta.url
// .prerender/chunks/'a kaydığı için relative path kırılır. cwd-sabit yol kullan.
const FONT_DIR = resolve(process.cwd(), 'src/assets/fonts');

const fontRegular = readFileSync(resolve(FONT_DIR, 'JetBrainsMono-Regular.ttf'));
const fontBold = readFileSync(resolve(FONT_DIR, 'JetBrainsMono-Bold.ttf'));

export const C = {
  bg: '#0a0a0a',
  fg: '#e8e6e1',
  dim: '#8a8478',
  rule: '#1c1c1c',
  accent: '#ff4d2e',
} as const;

const FONTS: SatoriOptions['fonts'] = [
  { name: 'JetBrains Mono', data: fontRegular, weight: 400, style: 'normal' },
  { name: 'JetBrains Mono', data: fontBold, weight: 700, style: 'normal' },
];

export interface OgCardData {
  /** topbar sağ — örn. "blog/talha-bekler/excelin-bittigi-yer" */
  breadcrumb: string;
  /** üç metaRow — [label, value] çiftleri */
  meta: Array<[string, string]>;
  /** büyük başlık */
  title: string;
  /** alt açıklama (kesilmiş, ~140 karakter) */
  lede: string;
  /** footer sol — etiketler veya teknoloji yığını */
  footTags: string;
}

export async function renderOg(data: OgCardData): Promise<Buffer> {
  const svg = await satori(buildTree(data), {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
}

function buildTree(d: OgCardData) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        backgroundColor: C.bg,
        color: C.fg,
        fontFamily: 'JetBrains Mono',
      },
      children: [topbar(d.breadcrumb), body(d), footer(d.footTags)],
    },
  };
}

function topbar(breadcrumb: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        height: 64,
        padding: '0 48px',
        borderBottom: `1px solid ${C.rule}`,
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 16,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: C.accent,
                    marginRight: 14,
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: { color: C.fg, fontWeight: 500 },
                  children: '[talha bekler]',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { color: C.dim },
            children: breadcrumb,
          },
        },
      ],
    },
  };
}

function body(d: OgCardData) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '48px 48px 32px 48px',
        justifyContent: 'space-between',
      },
      children: [
        // üst: meta
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: d.meta.map(([label, value]) => metaRow(label, value)),
          },
        },
        // orta-alt: title + lede
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 64,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: C.fg,
                    letterSpacing: '-0.02em',
                  },
                  children: d.title,
                },
              },
              d.lede
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: 22,
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: C.dim,
                        marginTop: 24,
                      },
                      children: d.lede,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

function metaRow(label: string, value: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        fontSize: 16,
        marginBottom: 6,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { color: C.dim, width: 96 },
            children: label,
          },
        },
        {
          type: 'div',
          props: {
            style: { color: C.fg, fontWeight: 500 },
            children: value,
          },
        },
      ],
    },
  };
}

function footer(tags: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        height: 64,
        padding: '0 48px',
        borderTop: `1px solid ${C.rule}`,
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 16,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { color: C.dim },
            children: tags,
          },
        },
        {
          type: 'div',
          props: {
            style: { color: C.fg, fontWeight: 500 },
            children: 'talhabekler.com.tr',
          },
        },
      ],
    },
  };
}
