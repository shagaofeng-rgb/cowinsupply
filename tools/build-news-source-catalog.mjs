import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "data", "news", "source-catalog.input.md");
const output = path.join(root, "data", "news");
const VERIFIED_SOURCE_OVERRIDES = {
  "www-constructionenquirer-com": {
    active: true,
    robotsAllowed: true,
    rssUrl: "https://www.constructionenquirer.com/feed/",
    trustLevel: "high",
    notes: "Verified 2026-08-20: public RSS returned 200 application/rss+xml and robots.txt allows the public feed."
  }
};
const tierFor = (domain) => /reddit|quora|forum|board/i.test(domain) ? "discovery-only" : /\.org$|association|institute|ieee|asnt|isa|smenet/i.test(domain) ? "A" : "B";
const lines = (await fs.readFile(input, "utf8")).split(/\r?\n/);
let group = "Uncategorized";
const seen = new Set();
const sources = [];
for (const line of lines) {
  const value = line.trim();
  if (value.startsWith("# ")) { group = value.slice(2); continue; }
  if (!value || value.startsWith(">") || value.startsWith("```")) continue;
  const domain = value.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  if (!/^[a-z0-9.-]+(?:\/[a-z0-9./-]+)?$/.test(domain) || seen.has(domain)) continue;
  seen.add(domain);
  const id = domain.replace(/[^a-z0-9]+/g, "-");
  const override = VERIFIED_SOURCE_OVERRIDES[id] || {};
  sources.push({ id, name: domain, domain, sourceGroup: group, industryTags: [group], discoveryMethod: override.rssUrl ? ["rss"] : ["public-page"], tier: tierFor(domain), active: false, robotsAllowed: null, lastCheckedAt: null, lastUsedAt: null, useCount: 0, notes: "Imported input. Activate only after public-access and robots review.", ...override, lastCheckedAt: override.rssUrl ? "2026-08-20T06:39:00.000Z" : null });
}
await fs.mkdir(output, { recursive: true });
await fs.writeFile(path.join(output, "source-catalog.seed.json"), JSON.stringify(sources, null, 2));
await fs.writeFile(path.join(output, "source-catalog.seed.csv"), ["id,name,domain,sourceGroup,tier,active"].concat(sources.map((s) => [s.id,s.name,s.domain,s.sourceGroup,s.tier,s.active].map((v) => `\"${String(v).replaceAll('\"','\"\"')}\"`).join(","))).join("\n") + "\n");
await fs.writeFile(path.join(output, "source-catalog.seed.md"), `# News source catalog seed\n\nInput: ${sources.length} unique sources\n\n${sources.map((s) => `- ${s.sourceGroup}: ${s.domain} (${s.tier})`).join("\n")}\n`);
console.log(JSON.stringify({ input: sources.length, unique: sources.length, discoveryOnly: sources.filter((s) => s.tier === "discovery-only").length }));
