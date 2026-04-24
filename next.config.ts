/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ilzijypghlyourydqhvt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add more hostnames later if you use other CDNs
    ],
  },

  // Allow ngrok and other development hosts (fixes CORS/HMR issue)
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],
};

export default nextConfig;