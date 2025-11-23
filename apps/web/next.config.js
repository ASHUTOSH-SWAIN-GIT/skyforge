/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          // Any request to /api/* in the browser...
          source: "/api/:path*",
          // ...is securely forwarded to your Go backend
          destination: "http://localhost:8080/:path*", 
        },
      ];
    },
  };
  
  export default nextConfig;