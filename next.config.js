/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // في نسخة Next.js 14.0.4، يجب وضع هذا الإعداد داخل experimental
    serverComponentsExternalPackages: ['undici', 'cheerio'],
  },
};

module.exports = nextConfig;
