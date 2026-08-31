import { MetadataRoute } from 'next';

const BASE_URL = 'https://ittda.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/oauth',
        '/invite',
        '/api/',
        '/group/',
        '/my/',
        '/record/',
        '/profile/',
        '/add',
        '/share/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
