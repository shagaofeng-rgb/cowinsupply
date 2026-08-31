/** @type {import('next').NextConfig} */
const legacyNewsSlugs = [
  "35",
  "36",
  "anglegrinder",
  "AngleGrinderBrushless",
  "AngleGrinderIndustry",
  "AngleGrinders",
  "anglegrinderskeyrole",
  "brushlessangelgrinders",
  "index-q257a9712e3",
  "index-q289b109c68",
  "IndustrialAngleGrinder",
  "repair",
  "WallChaseImproves"
];

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
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests" }
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
      { source: "/es/blog", destination: "/blog", permanent: true },
      { source: "/es/blog/:slug", destination: "/blog/:slug", permanent: true },
      ...legacyNewsSlugs.map((slug) => ({ source: `/news/${slug}.html`, destination: "/news", permanent: true }))
    ];
  }
};

module.exports = nextConfig;
