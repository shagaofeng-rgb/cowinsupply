/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  output: undefined,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about/index.html", destination: "/about", permanent: true },
      { source: "/contact/index.html", destination: "/contact", permanent: true },
      { source: "/product/index.html", destination: "/product", permanent: true },
      { source: "/blog/index.html", destination: "/blog", permanent: true },
      { source: "/news/index.html", destination: "/news", permanent: true }
    ];
  }
};

module.exports = nextConfig;
