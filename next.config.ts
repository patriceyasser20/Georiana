import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */


const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  images: {
    qualities: [75, 90],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ilzijypghlyourydqhvt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "www.thefashionlaw.com",
      },
      {
        protocol: 'https',
        hostname: 'qhtselljfzsavnltrhsh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Allow ngrok and other development hosts (fixes CORS/HMR issue)
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "https://cosponsor-clumsy-rust.ngrok-free.dev",
  ],
  

  compress: true,
  
};


export default nextConfig;