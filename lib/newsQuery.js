const DEFAULT_PAGE_SIZE = 12;
const ALLOWED_PAGE_SIZES = new Set([6, 12, 24, 48]);

export function filterNews(items, filters = {}) {
  const query = normalise(filters.q);
  const category = normalise(filters.category);
  const product = normalise(filters.product);
  const source = normalise(filters.source);
  const language = normalise(filters.language);
  const tag = normalise(filters.tag);
  const period = normalise(filters.period);
  const now = Date.now();

  return items.filter((item) => {
    const relatedProducts = Array.isArray(item.relatedProducts) ? item.relatedProducts : [];
    const tags = Array.isArray(item.secondaryKeywords) ? item.secondaryKeywords : [];
    const haystack = [item.title, item.summary, item.category, item.sourcePublisher, item.sourceTitle, item.primaryKeyword, ...tags]
      .join(" ")
      .toLowerCase();
    const publishedAt = new Date(item.publishedAt || item.updatedAt || item.createdAt || 0).getTime();

    return (!query || haystack.includes(query))
      && (!category || normalise(item.category) === category)
      && (!source || normalise(item.sourcePublisher) === source)
      && (!language || normalise(item.language || item.sourceLanguage) === language)
      && (!tag || tags.some((value) => normalise(value) === tag) || normalise(item.primaryKeyword) === tag)
      && (!product || relatedProducts.some((entry) => [entry.productSlug, entry.productId, entry.productTitle].some((value) => normalise(value) === product)))
      && matchesPeriod(publishedAt, period, now);
  });
}

export function paginateNews(items, filters = {}) {
  const pageSize = ALLOWED_PAGE_SIZES.has(Number(filters.pageSize)) ? Number(filters.pageSize) : DEFAULT_PAGE_SIZE;
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(filters.page) || 1), pageCount);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, pageCount };
}

export function newsFilterOptions(items, products = []) {
  return {
    categories: unique(items.map((item) => item.category)),
    sources: unique(items.map((item) => item.sourcePublisher)),
    languages: unique(items.map((item) => item.language || item.sourceLanguage)),
    tags: unique(items.flatMap((item) => [item.primaryKeyword, ...(Array.isArray(item.secondaryKeywords) ? item.secondaryKeywords : [])])),
    products: products.map((product) => ({ slug: product.slug, title: product.title }))
  };
}

function matchesPeriod(publishedAt, period, now) {
  if (!period) return true;
  if (!Number.isFinite(publishedAt) || !publishedAt) return false;
  const hours = { day: 24, week: 24 * 7, month: 24 * 31 }[period];
  return !hours || publishedAt >= now - hours * 60 * 60 * 1000;
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}
