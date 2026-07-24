/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  output: undefined,
  async rewrites() {
    return [
      {
        source: "/product/:slug.html",
        destination: "/product/:slug"
      }
    ];
  }
};

module.exports = nextConfig;
