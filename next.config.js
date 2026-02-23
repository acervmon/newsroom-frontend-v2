/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    unoptimized: true,
    domains: ["newsroomcache.s3.eu-north-1.amazonaws.com"],
  },
};

module.exports = nextConfig;
