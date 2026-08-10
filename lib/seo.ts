// lib/seo.ts
import { headers } from 'next/headers';

const SITE = 'https://georiana.com';

export async function getLocaleMeta(pathPart: string) {
  const headersList = await headers();
  const locale = (headersList.get('x-locale') as 'en' | 'ar') || 'en';

  const enUrl = `${SITE}${pathPart}`;
  const arUrl = pathPart === '/' ? `${SITE}/ar` : `${SITE}/ar${pathPart}`;
  const canonical = locale === 'ar' ? arUrl : enUrl;

  return {
    locale,
    canonical,
    alternates: {
      canonical,
      languages: { en: enUrl, ar: arUrl, 'x-default': enUrl },
    },
  };
}