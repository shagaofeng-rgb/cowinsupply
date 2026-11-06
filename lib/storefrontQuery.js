import { cmsBodyRewriteTokens } from "@/lib/cmsText";

// The characters removed by JavaScript's String.prototype.trim().
const jsTrimSpace = "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";

export async function readStorefrontCatalog(sql, includeNews, includeNewsBodies = false) {
  const [snapshot] = await sql`
    WITH catalog AS (
      SELECT value AS items FROM cowin_store
      WHERE store_key = 'cms-items' AND jsonb_typeof(value) = 'array'
    ), visible AS (
      SELECT doc, position FROM catalog
      CROSS JOIN LATERAL jsonb_array_elements(items) WITH ORDINALITY AS entry(doc, position)
      WHERE (doc->>'type' = 'product' AND coalesce(doc->>'status', '') NOT IN ('offline', 'draft', 'deleted'))
         OR (${includeNews}::boolean AND doc->>'type' = 'news' AND doc->>'status' = 'published')
    ), news_bodies AS MATERIALIZED (
      SELECT position, CASE
        WHEN doc->>'content' IS NULL THEN ''
        WHEN jsonb_typeof(doc->'content') <> 'string' OR EXISTS (
          SELECT 1 FROM unnest(${cmsBodyRewriteTokens}::text[]) AS rewrite(token)
          WHERE strpos(lower((doc->>'content') COLLATE "C"), rewrite.token) > 0
        ) THEN NULL
        ELSE btrim(doc->>'content', ${jsTrimSpace})
      END AS comparable
      FROM visible WHERE doc->>'type' = 'news' AND NOT ${includeNewsBodies}::boolean
    ), news_keys AS MATERIALIZED (
      -- Identical, nonempty text shares the first position as a comparison key.
      -- NULL asks the caller to use the existing normalizer if the title has peers.
      -- Compute once: the join can otherwise rerun this window for each card.
      SELECT position, CASE WHEN comparable IS NULL OR comparable = '' THEN comparable
        ELSE min(position) OVER (PARTITION BY comparable COLLATE "C")::text END AS body_key
      FROM news_bodies
    ), cards AS (
      SELECT visible.position, CASE WHEN doc->>'type' = 'product' THEN jsonb_build_object(
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
        'content', CASE WHEN ${includeNewsBodies}::boolean THEN doc->'content' END,
        'storefrontBodyKey', news_keys.body_key, 'publishedAt', doc->'publishedAt',
        'updatedAt', doc->'updatedAt', 'createdAt', doc->'createdAt'
      ) END AS card FROM visible LEFT JOIN news_keys USING (position)
    )
    SELECT (SELECT value FROM cowin_store WHERE store_key = 'seo-cleanup-version') AS "cleanupVersion",
      coalesce((SELECT jsonb_array_length(items) > 0 FROM catalog), false) AS "hasItems",
      coalesce((SELECT jsonb_agg(card ORDER BY position) FROM cards), '[]'::jsonb) AS items
  `;
  return snapshot;
}
