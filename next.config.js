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
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about/index.html", destination: "/about", permanent: true },
      { source: "/contact/index.html", destination: "/contact", permanent: true },
      { source: "/message/index.html", destination: "/message", permanent: true },
      { source: "/product/index.html", destination: "/product", permanent: true },
      { source: "/blog/index.html", destination: "/blog", permanent: true },
      { source: "/news/index.html", destination: "/news", permanent: true },
      ...legacyNewsSlugs.map((slug) => ({ source: `/news/${slug}.html`, destination: "/news", permanent: true }))
    ];
  }
};

module.exports = nextConfig;
