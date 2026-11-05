import Script from "next/script";
import { interiorChrome, notFoundContent } from "@/lib/interiorRendering";

export default function NotFound() {
  // Route handlers and the React fallback share the same public stylesheet.
  // This page is the only React route that should load it.
  /* eslint-disable @next/next/no-css-tags */
  return <>
    <title>Page not found | Cowin Supply</title>
    <link rel="stylesheet" href="/cowin-assets/interiors.css" precedence="cowin-interior" />
    <div className="interior interior-not-found" dangerouslySetInnerHTML={{ __html: interiorChrome(notFoundContent(), "", true) }} />
    <Script src="/cowin-assets/interiors.js" strategy="afterInteractive" />
    <Script src="/cowin-assets/unified-site.js" strategy="afterInteractive" />
  </>;
}
