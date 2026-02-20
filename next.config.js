/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/escrs-survey-tool' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/escrs-survey-tool/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
