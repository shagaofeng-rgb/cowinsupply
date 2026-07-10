import fs from "node:fs/promises";
import path from "node:path";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate"
};

export async function publicHtmlResponse(relativePath) {
  const publicRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "public");
  const filePath = path.resolve(publicRoot, relativePath);

  if (!filePath.startsWith(publicRoot)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const html = await fs.readFile(filePath, "utf8");
    return new Response(injectTracking(html), { headers: HTML_HEADERS });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function injectTracking(html) {
  if (html.includes("/api/track")) return html;
  const script = `<script>
(function(){
  try {
    var visitorKey = "cowinsupply_visitor_id";
    var sessionKey = "cowinsupply_session_id";
    var visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      localStorage.setItem(visitorKey, visitorId);
    }
    var sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      sessionStorage.setItem(sessionKey, sessionId);
    }
    var payload = JSON.stringify({
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
      language: navigator.language,
      screen: screen.width + "x" + screen.height,
      visitorId: visitorId,
      sessionId: sessionId
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  } catch (error) {}
})();
</script>`;
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}
