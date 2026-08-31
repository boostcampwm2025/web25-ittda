import { MetadataRoute } from 'next';

const BASE_URL = 'https://ittda.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}