/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'www.loft-shop.pp.ua',
      'loft-shop.pp.ua',
      'images.unsplash.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.loft-shop.pp.ua',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'loft-shop.pp.ua',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
