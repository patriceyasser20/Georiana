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
        hostname: 'ilzijypghlyourydqhvt.supabase.co', // ← your Supabase storage domain
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add more hostnames later if you use other CDNs (e.g. cloudinary, imgix, etc.)
    ],
  },
};

export default nextConfig;