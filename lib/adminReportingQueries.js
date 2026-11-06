import { isCalendarDate } from "./adminDateRange.js";

export function reportWindow(input = {}) {
  const page = Number(input.page);
  const pageSize = Number(input.pageSize);
  const from = isCalendarDate(input.from) ? input.from : "";
  const to = isCalendarDate(input.to) ? input.to : "";
  const end = to ? new Date(to + "T00:00:00+08:00") : null;
  if (end) end.setUTCDate(end.getUTCDate() + 1);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000000) : 1,
    pageSize: [10, 20, 50, 100].includes(pageSize) ? pageSize : 20,
    start: from ? from + "T00:00:00+08:00" : "-infinity",
    end: end ? end.toISOString() : "infinity",
    keyword: String(input.q || "").trim().toLowerCase().slice(0, 180)
  };
}

function resultPage(rows, pageSize, map) {
  return {
    page: Number(rows[0]?.result_page || 1),
    total: Number(rows[0]?.total || 0),
    pageSize,
    items: rows.filter((row) => row.identity).map(map)
  };
}

export async function readTrafficReport(sql, input) {
  const { start, end } = reportWindow(input);
  const [row] = await sql`
    WITH visits AS (
      SELECT created_at, coalesce('visitor:' || nullif(visitor_id, ''), 'session:' || nullif(session_id, ''), 'record:' || id) AS identity,
        coalesce(nullif(payload->>'path', ''), '/') AS path,
        coalesce(nullif(payload->>'source', ''), '未知') AS source,
        coalesce(nullif(payload->>'device', ''), '未知') AS device,
        coalesce(nullif(payload->>'country', ''), '未知') AS country
      FROM cowin_visit_events WHERE created_at >= ${start}::timestamptz AND created_at < ${end}::timestamptz
    ), daily AS (
      SELECT to_char(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') AS day, count(*) AS pv FROM visits GROUP BY 1
    ), ranks AS (
      SELECT CASE WHEN grouping(source) = 0 THEN 'sources' WHEN grouping(device) = 0 THEN 'devices'
        WHEN grouping(country) = 0 THEN 'countries' ELSE 'topPages' END AS dimension,
        coalesce(source, device, country, path) AS key, count(*) AS count
      FROM visits GROUP BY GROUPING SETS ((source), (device), (country), (path))
    ), ordered AS (
      SELECT *, row_number() OVER (PARTITION BY dimension ORDER BY count DESC, key) AS position FROM ranks
    ), lists AS (
      SELECT dimension, jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY position) AS items
      FROM ordered WHERE position <= CASE WHEN dimension = 'topPages' THEN 10 ELSE 8 END GROUP BY dimension
    )
    SELECT count(*) AS pv, count(DISTINCT identity) AS uv,
      count(*) FILTER (WHERE path = '/product' OR path LIKE '/product/%' OR path LIKE '/products/%') AS product_views,
      count(*) FILTER (WHERE path = '/news' OR path LIKE '/news/%') AS news_views,
      (SELECT count(*) FROM cowin_inquiries WHERE created_at >= ${start}::timestamptz AND created_at < ${end}::timestamptz) AS inquiries,
      (SELECT jsonb_agg(daily ORDER BY day) FROM daily) AS daily,
      (SELECT jsonb_object_agg(dimension, items) FROM lists) AS rankings
    FROM visits`;
  return {
    pv: Number(row.pv), uv: Number(row.uv), productViews: Number(row.product_views), newsViews: Number(row.news_views),
    inquiries: Number(row.inquiries), daily: row.daily || [],
    sources: row.rankings?.sources || [], devices: row.rankings?.devices || [],
    countries: row.rankings?.countries || [], topPages: row.rankings?.topPages || []
  };
}

export async function readVisitPathReport(sql, input) {
  const { page, pageSize, start, end, keyword } = reportWindow(input);
  const rows = await sql`
    WITH visits AS (
      SELECT id, created_at,
        coalesce('session:' || nullif(session_id, ''), 'visitor:' || nullif(visitor_id, ''), 'record:' || id) AS identity,
        coalesce(nullif(payload->>'path', ''), '/') AS path
      FROM cowin_visit_events
      WHERE created_at >= ${start}::timestamptz AND created_at < ${end}::timestamptz
    ), sessions AS (
      SELECT identity, max(created_at) AS last_seen_at, count(*) AS path_count
      FROM visits
      GROUP BY identity
      HAVING ${keyword}::text = '' OR strpos(lower(identity), ${keyword}) > 0
        OR bool_or(strpos(lower(path), ${keyword}) > 0)
    ), tally AS (
      SELECT count(*) AS total,
        least(${page}::bigint, greatest(1, (count(*) + ${pageSize}::bigint - 1) / ${pageSize}::bigint)) AS result_page
      FROM sessions
    ), selected AS (
      SELECT * FROM sessions ORDER BY last_seen_at DESC, identity
      LIMIT ${pageSize} OFFSET (SELECT (result_page - 1) * ${pageSize}::bigint FROM tally)
    )
    SELECT tally.*, selected.*, ARRAY(
      SELECT path FROM visits WHERE visits.identity = selected.identity ORDER BY created_at, id LIMIT 12
    ) AS paths
    FROM tally LEFT JOIN selected ON true ORDER BY selected.last_seen_at DESC, selected.identity`;
  return resultPage(rows, pageSize, (row) => ({
    identity: row.identity,
    sessionId: row.identity.slice(row.identity.indexOf(":") + 1),
    paths: row.paths,
    pathCount: Number(row.path_count),
    lastSeenAt: row.last_seen_at
  }));
}

export async function readCustomerDirectoryReport(sql, input) {
  const { page, pageSize, start, end, keyword } = reportWindow(input);
  const rows = await sql`
    WITH inquiries AS (
      SELECT id, created_at, nullif(visitor_id, '') AS visitor_id, nullif(session_id, '') AS session_id,
        coalesce('email:' || nullif(lower(btrim(payload->>'email')), ''),
          'phone:' || nullif(regexp_replace(coalesce(payload->>'phone', ''), '[^0-9]', '', 'g'), ''),
          'visitor:' || nullif(visitor_id, ''), 'session:' || nullif(session_id, ''), 'record:' || id) AS identity,
        payload->>'name' AS name, payload->>'company' AS company, payload->>'email' AS email,
        payload->>'phone' AS phone,
        coalesce(nullif(payload->>'country', ''), nullif(payload->>'visitorCountry', '')) AS country
      FROM cowin_inquiries
      WHERE created_at >= ${start}::timestamptz AND created_at < ${end}::timestamptz
    ), visitor_owners AS (
      SELECT DISTINCT ON (visitor_id) visitor_id, identity FROM inquiries WHERE visitor_id IS NOT NULL
      ORDER BY visitor_id, created_at DESC, id DESC
    ), session_owners AS (
      SELECT DISTINCT ON (session_id) session_id, identity FROM inquiries WHERE session_id IS NOT NULL
      ORDER BY session_id, created_at DESC, id DESC
    ), visits AS (
      SELECT ev.id, ev.created_at, coalesce(v.identity, s.identity,
        'visitor:' || nullif(ev.visitor_id, ''), 'session:' || nullif(ev.session_id, ''), 'record:' || ev.id) AS identity,
        coalesce(nullif(ev.payload->>'path', ''), '/') AS path, nullif(ev.payload->>'country', '') AS country
      FROM cowin_visit_events ev
      LEFT JOIN visitor_owners v ON v.visitor_id = ev.visitor_id
      LEFT JOIN session_owners s ON s.session_id = ev.session_id
      WHERE ev.created_at >= ${start}::timestamptz AND ev.created_at < ${end}::timestamptz
    ), visit_counts AS (
      SELECT identity, count(*) AS views, count(DISTINCT path) AS unique_pages,
        min(created_at) AS first_seen_at, max(created_at) AS last_seen_at,
        (array_agg(country ORDER BY created_at DESC, id DESC) FILTER (WHERE country IS NOT NULL))[1] AS country
      FROM visits GROUP BY identity
    ), inquiry_counts AS (
      SELECT identity, count(*) AS inquiry_count, min(created_at) AS first_seen_at, max(created_at) AS last_seen_at
      FROM inquiries GROUP BY identity
    ), inquiry_contact AS (
      SELECT DISTINCT ON (identity) identity, name, company, email, phone, country
      FROM inquiries ORDER BY identity, created_at DESC, id DESC
    ), customers AS (
      SELECT coalesce(v.identity, i.identity) AS identity,
        coalesce(nullif(c.name, ''), '匿名访客') AS name, coalesce(c.company, '') AS company,
        coalesce(c.email, '') AS email, coalesce(c.phone, '') AS phone,
        coalesce(c.country, v.country, '') AS country, coalesce(v.views, 0) AS views,
        coalesce(v.unique_pages, 0) AS unique_pages, coalesce(i.inquiry_count, 0) AS inquiry_count,
        least(v.first_seen_at, i.first_seen_at) AS first_seen_at,
        greatest(v.last_seen_at, i.last_seen_at) AS last_seen_at
      FROM visit_counts v FULL OUTER JOIN inquiry_counts i USING (identity)
      LEFT JOIN inquiry_contact c ON c.identity = i.identity
    ), matches AS (
      SELECT * FROM customers
      WHERE ${keyword}::text = '' OR strpos(lower(concat_ws(' ', name, company, email, phone, country, identity)), ${keyword}) > 0
    ), tally AS (
      SELECT count(*) AS total,
        least(${page}::bigint, greatest(1, (count(*) + ${pageSize}::bigint - 1) / ${pageSize}::bigint)) AS result_page
      FROM matches
    ), selected AS (
      SELECT * FROM matches ORDER BY last_seen_at DESC, identity
      LIMIT ${pageSize} OFFSET (SELECT (result_page - 1) * ${pageSize}::bigint FROM tally)
    )
    SELECT tally.*, selected.* FROM tally LEFT JOIN selected ON true ORDER BY selected.last_seen_at DESC, selected.identity`;
  return resultPage(rows, pageSize, (row) => ({
    identity: row.identity, name: row.name, company: row.company, email: row.email, phone: row.phone, country: row.country,
    pageViews: Number(row.views), uniquePages: Number(row.unique_pages), inquiryCount: Number(row.inquiry_count),
    firstSeenAt: row.first_seen_at, lastSeenAt: row.last_seen_at
  }));
}

export async function readScopedJourney(sql, { visitorIds = [], sessionIds = [], recordIds = [] } = {}) {
  const visitors = [...visitorIds].filter(Boolean);
  const sessions = [...sessionIds].filter(Boolean);
  const records = [...recordIds].filter(Boolean);
  if (!visitors.length && !sessions.length && !records.length) return [];
  const rows = await sql`
    SELECT payload FROM cowin_visit_events
    WHERE visitor_id = ANY(${visitors}::text[]) OR session_id = ANY(${sessions}::text[]) OR id = ANY(${records}::text[])
    ORDER BY created_at, id`;
  return rows.map((row) => row.payload);
}
