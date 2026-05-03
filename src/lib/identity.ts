/**
 * schema.org Person sabitleri — JSON-LD'de tekrar etmesin diye merkezde.
 * sameAs için bkz. https://schema.org/sameAs
 */
export const SITE_URL = 'https://talhabekler.com.tr';

export const author = {
  '@type': 'Person' as const,
  name: 'Talha Bekler',
  url: SITE_URL,
  sameAs: ['https://github.com/MadDuck54'],
};
