/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Habilitar SSR con modo standalone
  output: "standalone",

  images: {
    unoptimized: true,
    domains: ["newsroomcache.s3.eu-north-1.amazonaws.com"],
  },

  env: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || "eu-north-1",
    S3_BUCKET: process.env.S3_BUCKET || "newsroomcache",
  },
};

module.exports = nextConfig;
