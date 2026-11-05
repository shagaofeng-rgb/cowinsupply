import { articleDate, breadcrumbs, button, escapeHtml, icon, interiorPage, media, pageHeading, textLink, SITE_URL } from "@/lib/interiorRendering";
import { LEGACY_NEWS_REDIRECTS } from "@/lib/seoContentPolicy";

const archiveUrl = section => `/news/${section}/index.html`;
export const legacyNewsSections = new Map([["2", "Company News"], ["1", "Media Coverage"], ["3", "Industry Updates"]]);
const legacyImages = "/_assets/cdn.fuwucms.com/a/375612959223/files";

// Titles and publication dates transcribed from the original /news/2/index.html.
const companyNews = [
  ["IndustrialAngleGrinder", "New Industrial Angle Grinder for Professional Cutting and Grinding", "2026-04-29", `${legacyImages}/1827e6843ae7d00d76362cf141aface1-721e22e164.jpg`, "Angle grinder in use for metal cutting"],
  ["WallChaseImproves", "New Brushless Wall Chaser Improves Cutting Efficiency for Modern Renovation Projects", "2026-04-11", "/cowin-assets/scene-detail-application.jpg", "Wall chaser held against a masonry surface"],
  ["35", "Angle Grinders Continue to Play a Key Role in Construction and Maintenance Work", "2026-03-13", `${legacyImages}/03e82d7733ec0772a28ada4a642cacfc-721e22e164.png`, "Angle grinder and cable in a tool bag"],
  ["anglegrinderskeyrole", "Angle Grinders Continue to Play a Key Role in Modern Construction", "2026-03-08", `${legacyImages}/0e3879c1ff617badffc3d752c9953df8-721e22e164.png`, "Angle grinder in use on a metal part"],
  ["AngleGrinders", "Angle Grinders and Cutting Machines Drive Efficiency in Modern Construction and Metalworking", "2026-02-13", `${legacyImages}/947b66fe29a0c12b7c79d2542bf66cdd-721e22e164.jpg`, "Orange angle grinder"],
  ["AngleGrinderBrushless", "Angle Grinder Market Continues to Grow with Focus on Efficiency and Safety", "2026-02-07", `${legacyImages}/0e3879c1ff617badffc3d752c9953df8-721e22e164.png`, "Angle grinder in use on a metal part"],
  ["repair", "What should be done to repair an electric angle grinder if it stops working?", "2026-01-31", `${legacyImages}/947b66fe29a0c12b7c79d2542bf66cdd-721e22e164.jpg`, "Orange angle grinder"]
];

export function renderLegacyNewsArchive(section, posts) {
  const label = legacyNewsSections.get(section);
  const populated = section === "2";
  const title = populated ? "Company News Archive" : label;
  const description = populated ? "Previous Cowin Supply announcements and related buying guides." : "Visit the current News page for Cowin Supply updates.";
  const blogPaths = new Set(posts.map(post => `/blog/${encodeURIComponent(post.slug)}`));
  const cards = populated ? companyNews.map(([slug, title, date, src, alt]) => {
    const target = LEGACY_NEWS_REDIRECTS.get(slug);
    const guide = blogPaths.has(target) ? target : "";
    return `<article class="cw-news-row">
      ${guide ? `<a class="cw-card-media-link" href="${guide}" aria-label="Read the guide related to ${escapeHtml(title)}">${media(src, alt)}</a>` : media(src, alt)}
      <div><h2>${escapeHtml(title)}</h2><p class="cw-byline">${articleDate(date)}</p></div>
      ${guide ? textLink("Related guide", guide) : ""}
    </article>`;
  }).join("") : "";
  return interiorPage({
    title: `${title} | Cowin Supply`, description, canonical: `${SITE_URL}${archiveUrl(section)}`, active: "/news", compactFooter: true,
    ...(populated ? {} : { robots: "noindex,follow" }),
    body: `<main class="cw-wrap cw-page${populated ? "" : " cw-archive-empty"}" id="main-content">${breadcrumbs([["News", "/news"], [label]])}
      ${pageHeading("News archive", title, "")}
      ${populated ? `<p class="cw-archive-current">${textLink("Browse current news", "/news")}</p>` : ""}
      <div class="cw-archive-layout">
        <details class="cw-side-nav" data-collapsible-wide open><summary>Archive categories${icon("chevron-down")}</summary><nav aria-label="News archive categories">
          ${Array.from(legacyNewsSections, ([id, name]) => `<a href="${archiveUrl(id)}"${section === id ? ' aria-current="page"' : ""}>${name}</a>`).join("")}
        </nav></details>
        ${populated ? `<section class="cw-news-list" aria-label="Company news archive">${cards}</section>` : `<div class="cw-empty">${icon("news")}<h2>${section === "1" ? "No media coverage is available here." : "No industry updates are available here."}</h2>
          <p>${description}</p><div class="cw-actions">${button("Browse current news", "/news", { graphic: "arrow-right" })}${textLink("Visit the Blog", "/blog")}</div></div>`}
      </div>
    </main>`
  });
}
