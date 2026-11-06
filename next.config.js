const legacyNewsRedirects = require("./lib/legacyNewsRedirects.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  output: undefined,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'self' https://www.google.com/maps; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests" }
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about/index.html", destination: "/about", permanent: true },
      { source: "/contact/index.html", destination: "/contact", permanent: true },
      { source: "/message/index.html", destination: "/message", permanent: true },
      { source: "/product/index.html", destination: "/product", permanent: true },
      { source: "/blog/index.html", destination: "/blog", permanent: true },
      { source: "/news/index.html", destination: "/news", permanent: true },
      { source: "/measuring-tools", destination: "/products/measuring-tools", permanent: true },
      { source: "/products/electric-wall-chasers", destination: "/products/wall-chasers", permanent: true },
      { source: "/industrial-tools", destination: "/product", permanent: true },
      { source: "/es/blog", destination: "/blog", permanent: true },
      { source: "/es/blog/:slug", destination: "/blog/:slug", permanent: true },
      // Redirect old HTML before public file lookup can serve the archived copy.
      ...Object.entries(legacyNewsRedirects).map(([slug, destination]) => ({
        source: `/news/${slug}.html`, destination, permanent: true
      })),
      { source: "/news/index-q257a9712e3.html", destination: "/news", permanent: true },
      { source: "/news/index-q289b109c68.html", destination: "/news", permanent: true }
    ];
  }
};

module.exports = nextConfig;
