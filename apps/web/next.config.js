/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: "http://localhost:8080/:path*",
        },
      ],
    };
  },
};

export default nextConfig;