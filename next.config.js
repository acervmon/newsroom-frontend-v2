/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< Updated upstream
  output: "standalone",
  images: {
    unoptimized: true,
    domains: ["newsroomcache.s3.eu-north-1.amazonaws.com"],
=======

  // Habilitar SSR con modo standalone
  output: 'standalone', // Construye la app para un entorno de servidor

  images: {
    unoptimized: true, // Desactiva optimización de imágenes (útil en Amplify)
    domains: ['newsroomcache.s3.eu-north-1.amazonaws.com'], // Tu dominio S3
  },

  env: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || "eu-north-1",
    S3_BUCKET: process.env.S3_BUCKET || "newsroomcache",
>>>>>>> Stashed changes
  },
};

module.exports = nextConfig;
