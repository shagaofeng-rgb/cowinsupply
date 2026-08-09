import Link from "next/link";
import { notFound } from "next/navigation";
import { getInquiryDetail } from "@/lib/cmsStore";

const statuses = [["new", "New"], ["contacted", "Contacted"], ["quoted", "Quoted"], ["closed", "Closed"], ["invalid", "Invalid"], ["archived", "Archived"]];

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({ params }) {
  const { id } = await params;
  const detail = await getInquiryDetail(id);
  if (!detail) notFound();
  const { inquiry, journey, summary, journeyAvailable } = detail;

  return <>
    <header className="admin-page-head inquiry-detail-head">
      <div><Link className="admin-back-link" href="/admin/inquiries">Back to inquiries</Link><h1>{inquiry.name || "Unnamed contact"}</h1><p>{inquiry.company || "No company provided"} · submitted {formatTime(inquiry.createdAt)}</p></div>
      <form className="admin-inline-form" action="/api/admin/inquiries/status" method="post"><input name="id" type="hidden" value={inquiry.id} /><select name="status" defaultValue={inquiry.status}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="submit">Save status</button></form>
    </header>
    <section className="inquiry-summary-grid"><Summary label="Submitted" value={formatTime(inquiry.createdAt)} /><Summary label="Page views" value={`${summary.pageViews} views / ${summary.uniquePages} pages`} /><Summary label="First seen" value={summary.firstSeenAt ? formatTime(summary.firstSeenAt) : "No recorded visit"} /><Summary label="Last seen" value={summary.lastSeenAt ? formatTime(summary.lastSeenAt) : "No recorded visit"} /></section>
    <section className="admin-two-col inquiry-detail-grid">
      <DetailSection title="Contact and requirement" rows={[["Name", inquiry.name], ["Company", inquiry.company], ["Email", inquiry.email], ["Phone / WhatsApp", inquiry.phone], ["Country / region", inquiry.country], ["Buyer type", inquiry.buyerType], ["Estimated quantity", inquiry.estimatedQuantity], ["Product", inquiry.product], ["Model", inquiry.productModel], ["Required voltage / specification", inquiry.requiredSpecification]]} />
      <DetailSection title="Source and visit context" rows={[["Submitted page", inquiry.pageUrl], ["Landing page", inquiry.landingPage], ["Referrer", inquiry.referrer], ["UTM source", inquiry.utmSource], ["UTM medium", inquiry.utmMedium], ["UTM campaign", inquiry.utmCampaign], ["UTM term", inquiry.utmTerm], ["UTM content", inquiry.utmContent], ["Visitor country", inquiry.visitorCountry], ["Browser language", inquiry.browserLanguage], ["Visitor timezone", inquiry.timezone], ["Screen", inquiry.screen]]} />
    </section>
    <section className="admin-card inquiry-message-card"><h2>Customer message</h2><p>{inquiry.message || "No message provided."}</p></section>
    <section className="admin-card journey-card"><small>Visitor journey</small><h2>Recorded page-view path</h2><p className="admin-muted">Events are linked only through the visitor or session ID submitted with this form. Older records are never given invented history.</p>{!journeyAvailable ? <div className="empty-line">This older inquiry does not have a visitor ID, so no reliable path can be shown.</div> : null}{journeyAvailable && !journey.length ? <div className="empty-line">The form contains a visitor ID, but there are no matching page-view events yet.</div> : null}{journey.length ? <ol className="journey-timeline">{journey.map((event) => <li key={event.id}><time>{formatTime(event.createdAt)}</time><div><strong>{event.path}</strong><p>{event.title || "No page title"}</p><span>{event.source || "Direct"} · {event.device || "Unknown device"} · {event.country || "Unknown country"}</span>{event.referrer ? <small>Referrer: {event.referrer}</small> : null}</div></li>)}</ol> : null}</section>
  </>;
}

function DetailSection({ title, rows }) { return <section className="admin-card inquiry-fields"><h2>{title}</h2><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{linkValue(value)}</dd></div>)}</dl></section>; }
function Summary({ label, value }) { return <section className="admin-card inquiry-summary"><small>{label}</small><strong>{value}</strong></section>; }
function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "-"; }
function linkValue(value) { const text = String(value || "-"); return /^https?:\/\//.test(text) ? <a href={text} target="_blank" rel="noreferrer">{text}</a> : text; }
