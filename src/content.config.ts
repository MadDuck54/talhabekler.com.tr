import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    lede: z.string().optional(),
    /** Google snippet için — verilmezse lede'nin ilk 155 karakteri kullanılır */
    metaDescription: z.string().max(160).optional(),
    /** sosyal paylaşım başlığı — verilmezse title kullanılır */
    ogTitle: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** belge numarası — başlığa BLOG—NNN olarak işlenir; verilmezse otomatik */
    docNumber: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };
