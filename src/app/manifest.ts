import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '上班吃什麼',
    short_name: '上班吃什麼',
    description: '午休煩惱終結者 — 員工特約店家一覽',
    start_url: '/',
    display: 'standalone',
    background_color: '#FEF1F0',
    theme_color: '#EE6C64',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
