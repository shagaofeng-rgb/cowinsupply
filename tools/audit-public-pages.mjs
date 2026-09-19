// Read-only audit of every sitemap page and its image URLs.
const base = process.argv[2] || 'https://www.cowinsupply.com';
const origin = 'https://www.cowinsupply.com';
const decode = value => value.replaceAll('&amp;', '&');
const locs = text => [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decode(x[1]));
async function get(url) { return fetch(url, { signal: AbortSignal.timeout(25000) }); }
async function pooled(items, fn) {
  const results = []; let index = 0;
  await Promise.all(Array.from({length: 5}, async () => { while(index < items.length) { const i=index++; try { results[i]=await fn(items[i]); } catch(e) {results[i]={url:items[i],error:e.message};} } }));
  return results;
}
const sitemap = await (await get(base+'/sitemap.xml')).text();
const maps = await pooled(locs(sitemap), async url => locs(await (await get(base+new URL(url).pathname)).text()));
const urls = [...new Set(maps.flat().filter(x => typeof x === 'string'))];
const images = new Set();
const pages = await pooled(urls, async url => {
  const response = await get(base+new URL(url).pathname);
  const html = await response.text();
  for(const match of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/g)) images.add(new URL(decode(match[1]),url).href);
  return {url,status:response.status,header:html.includes('class="cowin-header"'),footer:html.includes('class="cowin-footer"'),form:html.includes('action="/api/inquiry"')};
});
const media = await pooled([...images],async url => {
  const response=await get(url.startsWith(origin)?base+new URL(url).pathname:url);
  return {url,status:response.status,type:response.headers.get('content-type')};
});
console.log(JSON.stringify({pages:pages.length,images:media.length,forms:pages.filter(x=>x.form).map(x=>x.url),pageIssues:pages.filter(x=>x.error||x.status!==200||!x.header||!x.footer),imageIssues:media.filter(x=>x.error||x.status!==200||!x.type?.startsWith('image/'))},null,2));
