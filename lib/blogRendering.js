import { getTaxonomyItem } from "@/lib/catalogTaxonomy";
import { blogCover, showBlogImage } from "@/lib/blogMedia";
import { compactText } from "@/lib/contentQuality";
import {
  SITE_URL, articleContent, articleDate, articleLayout, breadcrumbs, button, escapeHtml, icon, interiorPage,
  kicker, media, pageHeading, paginationNav, textLink
} from "@/lib/interiorRendering";

export const BLOG_PAGE_SIZE = 12;
const blogUrl = post => `/blog/${encodeURIComponent(post.slug)}`;
const blogDescription = "Practical sourcing and product selection guidance for professional buyers.";
const blogSummary = post => String(post.summary || post.seoDescription || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export function searchBlog(posts, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return posts.filter(post => terms.every(term => String(post.title || "").toLowerCase().includes(term)));
}

function blogCard(post, featured) {
  const href = blogUrl(post);
  const tag = post.category || "Sourcing guide";
  const cover = blogCover(post, topicFor(post));
  const link = `<a class="cw-card-media-link" href="${href}" aria-label="Read ${escapeHtml(post.title)}">${media(cover.src, cover.alt, { eager: featured, product: cover.product, fallback: "Sourcing guide", fallbackIcon: "file-description" })}</a>`;
  const byline = articleDate(post.publishedAt || post.createdAt);
  return featured ? `<article class="cw-blog-feature">${link}<div>${kicker(tag)}<h2><a href="${href}">${escapeHtml(post.title)}</a></h2>
    <p>${escapeHtml(compactText(blogSummary(post), 195))}</p>${byline ? `<p class="cw-byline">${byline}</p>` : ""}${textLink("Read guide", href)}</div></article>`
    : `<article class="cw-blog-card">${link}<div class="cw-card-copy">${kicker(tag)}<h3><a href="${href}">${escapeHtml(post.title)}</a></h3>
      ${byline ? `<p class="cw-byline">${byline}</p>` : ""}${textLink("Read guide", href)}</div></article>`;
}

export function renderBlogListHtml({ posts, query = "", page = 1, total = posts.length }) {
  const hasFeature = !query && page === 1 && posts.length > 0;
  const list = hasFeature ? posts.slice(1) : posts;
  const href = number => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (number > 1) params.set("page", number);
    return `/blog${params.size ? `?${params}` : ""}`;
  };
  return interiorPage({
    title: "Blog | Cowin Supply", description: blogDescription, canonical: `${SITE_URL}/blog${!query && page > 1 ? `?page=${page}` : ""}`, active: "/blog",
    ...(query ? { robots: "noindex,follow" } : {}),
    body: `<main class="cw-wrap cw-page" id="main-content">${breadcrumbs([["Blog"]])}
      <div class="cw-blog-title-row">${pageHeading("Buyer resources", "Cowin Supply Blog", blogDescription)}
        <form class="cw-blog-search" action="/blog" role="search" aria-label="Search the blog">
          <label class="cw-search-field">${icon("search")}<span class="cw-sr">Guide title</span><input type="search" name="q" maxlength="120" value="${escapeHtml(query)}" placeholder="Search guides"></label>
          <button class="cw-button cw-button-dark" type="submit">Search</button>
        </form>
      </div>
      ${query ? `<p class="cw-result-count">${total} ${total === 1 ? "result" : "results"} for “${escapeHtml(query)}” · <a class="cw-text-link" href="/blog">Clear search</a></p>` : ""}
      ${hasFeature ? blogCard(posts[0], true) : ""}
      ${list.length ? `<section><h2>${query ? "Matching guides" : "Latest articles"}</h2><div class="cw-blog-grid">${list.map(post => blogCard(post, false)).join("")}</div></section>` : ""}
      ${posts.length ? "" : `<div class="cw-empty">${icon(query ? "search" : "file-description")}<h2>${query ? "No matching guides" : "No guides published yet"}</h2><p>${query ? "Try a shorter title or a different keyword." : "See the product catalog for current models."}</p>${button(query ? "Clear search" : "Browse products", query ? "/blog" : "/product", { secondary: true })}</div>`}
      ${paginationNav({ page, totalPages: Math.ceil(total / BLOG_PAGE_SIZE), href })}
    </main>`
  });
}

const categoryTopics = [
  ["wall-chasers", /\bwall[ -]chasers?\b/i],
  ["angle-grinders", /\bangle[ -]grinders?\b/i],
  ["jig-saws-curve-saws", /\bjig[ -]?saws?\b/i],
  ["cold-cutting-saws", /\bcold[ -]cutting[ -]saws?\b/i],
  ["wall-polishing-machines", /\bwall[ -](?:polish|sand)/i],
  ["laser-measuring-tapes", /\blaser[ -](?:tape|measuring tape)/i],
  ["laser-distance-meters", /\blaser[ -](?:rangefinder|distance meter)/i],
  ["chainsaws", /\bchain[ -]?saws?\b/i],
  ["cordless-drills", /\bcordless[ -]drills?\b/i],
  ["core-drills", /\bcore[ -]drill/i],
  ["electric-screwdrivers", /\belectric[ -]screwdrivers?\b/i]
];

function topicFor(post) {
  return categoryTopics.find(([, pattern]) => pattern.test(post.title || ""))?.[0]
    || categoryTopics.find(([, pattern]) => pattern.test(post.primaryKeyword || ""))?.[0];
}

function publishedArticleHref(href) {
  // The catalog is the equivalent for the old product overview. There are no
  // published case studies or vernier calipers to link to from imported guides.
  const path = href.split(/[?#]/, 1)[0].replace(/\/$/, "");
  if (path === "/product-overview") return "/product";
  if (path === "/case-studies" || path === "/products/vernier-caliper") return "";
  return href;
}

export function renderBlogDetailHtml({ post, relatedPosts = [] }) {
  const topic = topicFor(post);
  const category = getTaxonomyItem(topic);
  const others = relatedPosts.filter(item => item.slug !== post.slug);
  const related = others.filter(item => topic ? topicFor(item) === topic : post.category && item.category === post.category).slice(0, 3);
  const canonical = post.canonicalUrl || `${SITE_URL}${blogUrl(post)}`;
  const description = post.seoDescription || blogSummary(post);
  const cover = blogCover(post, topic);
  const content = articleContent(post.content || `<p>${escapeHtml(blogSummary(post))}</p>`, {
    mapHref: publishedArticleHref,
    allowImage: src => showBlogImage(src, topic, cover)
  });
  const schema = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description,
    image: cover.src ? [new URL(cover.src, SITE_URL).href] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: { "@type": "Organization", name: post.authorName || "Cowin Supply" },
    publisher: { "@type": "Organization", name: "Cowin Supply", url: SITE_URL },
    mainEntityOfPage: canonical
  };
  const body = articleLayout({
    label: post.category || "Sourcing guide", title: post.title, summary: blogSummary(post),
    byline: [articleDate(post.publishedAt || post.createdAt), escapeHtml(post.authorName || "Cowin Supply")].filter(Boolean).join(" · "),
    cover: cover.src ? `<figure class="cw-article-cover">${media(cover.src, cover.alt, { eager: true, product: cover.product })}${cover.context ? "<figcaption>Related tool shown for context.</figcaption>" : ""}</figure>` : "",
    content: content.html, headings: content.headings, tocTitle: "In this guide",
    aside: category ? `<section><h2>Related products</h2>${textLink(`Browse ${category.name.toLowerCase()}`, `/products/${category.slug}`)}</section>` : "",
    after: related.length ? `<section class="cw-article-related"><h2>Related guides</h2><ul>${related.map(item => `<li>${textLink(item.title, blogUrl(item))}</li>`).join("")}</ul></section>` : ""
  });
  return interiorPage({
    title: post.seoTitle || post.title, description, canonical, image: cover.src || "/cowin-assets/cowin-logo.png", type: "article", schema, active: "/blog",
    body: `<main class="cw-wrap cw-page" id="main-content">${breadcrumbs([["Blog", "/blog"], [post.category || "Guide"]])}${body}</main>`
  });
}
