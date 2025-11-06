/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'www.loft-shop.pp.ua',
      'loft-shop.pp.ua',
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
    ],
  },
};

export default nextConfig;
