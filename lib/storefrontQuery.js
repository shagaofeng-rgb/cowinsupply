// One read for the homepage and catalog. Keep the fields used by the existing
// renderers, plus News body text so exact-duplicate detection stays unchanged.
export async function readStorefrontCatalog(sql, includeNews) {
  const [snapshot] = await sql`
    WITH catalog AS (
      SELECT value AS items FROM cowin_store
      WHERE store_key = 'cms-items' AND jsonb_typeof(value) = 'array'
    ), visible AS (
      SELECT doc, position FROM catalog
      CROSS JOIN LATERAL jsonb_array_elements(items) WITH ORDINALITY AS entry(doc, position)
      WHERE (doc->>'type' = 'product' AND coalesce(doc->>'status', '') NOT IN ('offline', 'draft', 'deleted'))
         OR (${includeNews}::boolean AND doc->>'type' = 'news' AND doc->>'status' = 'published')
    ), cards AS (
      SELECT position, CASE WHEN doc->>'type' = 'product' THEN jsonb_build_object(
        'type', doc->'type', 'status', doc->'status', 'slug', doc->'slug',
        'title', doc->'title', 'model', doc->'model', 'summary', doc->'summary',
        'category', doc->'category', 'categorySlug', doc->'categorySlug',
        'image', doc->'image', 'gallery', jsonb_build_array(doc->'gallery'->0),
        'specifications', doc->'specifications', 'publishedAt', doc->'publishedAt',
        'updatedAt', doc->'updatedAt', 'createdAt', doc->'createdAt'
      ) ELSE jsonb_build_object(
        'type', doc->'type', 'status', doc->'status', 'slug', doc->'slug',
        'title', doc->'title', 'summary', doc->'summary', 'image', doc->'image',
        'coverImage', doc->'coverImage', 'relatedProducts', doc->'relatedProducts',
        'content', doc->'content', 'publishedAt', doc->'publishedAt',
        'updatedAt', doc->'updatedAt', 'createdAt', doc->'createdAt'
      ) END AS card FROM visible
    )
    SELECT (SELECT value FROM cowin_store WHERE store_key = 'seo-cleanup-version') AS "cleanupVersion",
      coalesce((SELECT jsonb_array_length(items) > 0 FROM catalog), false) AS "hasItems",
      coalesce((SELECT jsonb_agg(card ORDER BY position) FROM cards), '[]'::jsonb) AS items
  `;
  return snapshot;
}
