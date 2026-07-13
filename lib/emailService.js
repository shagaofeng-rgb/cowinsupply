import nodemailer from "nodemailer";

function smtpPort() {
  return Number(process.env.SMTP_PORT || 465);
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM &&
      process.env.ADMIN_NOTIFICATION_EMAIL
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inquiryEmailHtml(inquiry) {
  const rows = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Company", inquiry.company],
    ["Product", inquiry.product],
    ["Source", inquiry.source],
    ["Submitted At", inquiry.createdAt],
    ["Message", inquiry.message]
  ];

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
      <h2 style="margin:0 0 16px">New Cowin Supply Inquiry</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:680px">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <th align="left" style="border:1px solid #d9e1ea;background:#f4f6f8;width:150px">${escapeHtml(label)}</th>
                <td style="border:1px solid #d9e1ea">${escapeHtml(value || "-")}</td>
              </tr>
            `
          )
          .join("")}
      </table>
    </div>
  `;
}

function inquiryEmailText(inquiry) {
  return [
    "New Cowin Supply Inquiry",
    "",
    `Name: ${inquiry.name || "-"}`,
    `Email: ${inquiry.email || "-"}`,
    `Phone: ${inquiry.phone || "-"}`,
    `Company: ${inquiry.company || "-"}`,
    `Product: ${inquiry.product || "-"}`,
    `Source: ${inquiry.source || "-"}`,
    `Submitted At: ${inquiry.createdAt || "-"}`,
    "",
    "Message:",
    inquiry.message || "-"
  ].join("\n");
}

export async function sendAdminInquiryEmail(inquiry) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "email-not-configured" };
  }

  const port = smtpPort();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const subjectName = inquiry.name ? ` from ${inquiry.name}` : "";
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    replyTo: inquiry.email || process.env.SMTP_FROM,
    subject: `New Cowin Supply Inquiry${subjectName}`,
    text: inquiryEmailText(inquiry),
    html: inquiryEmailHtml(inquiry)
  });

  return { sent: true, messageId: info.messageId };
}

export async function sendEmailHealthCheck({ trigger = "cron" } = {}) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "email-not-configured" };
  }

  const port = smtpPort();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const checkedAt = new Date().toISOString();
  await transporter.verify();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: `Cowin Supply form email health check - ${checkedAt.slice(0, 10)}`,
    text: [
      "Cowin Supply form email health check",
      "",
      `Status: SMTP connection and sending test succeeded.`,
      `Trigger: ${trigger}`,
      `Checked At: ${checkedAt}`,
      "",
      "This automated message is sent every half month to confirm inquiry form email delivery."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
        <h2>Cowin Supply form email health check</h2>
        <p><strong>Status:</strong> SMTP connection and sending test succeeded.</p>
        <p><strong>Trigger:</strong> ${escapeHtml(trigger)}</p>
        <p><strong>Checked At:</strong> ${escapeHtml(checkedAt)}</p>
        <p>This automated message is sent every half month to confirm inquiry form email delivery.</p>
      </div>
    `
  });

  return { sent: true, messageId: info.messageId, checkedAt };
}

export async function sendNewsShortfallAlert({ date, targetCount, publishedCount, missingCount, trigger, sourceResults = [] }) {
  if (!isEmailConfigured()) return { sent: false, reason: "email-not-configured" };

  const port = smtpPort();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
  const sources = sourceResults.map((source) => `${source.source}: ${source.accepted || 0} recent candidates`).join("; ") || "No eligible source items";
  const text = [
    "Cowin Supply News automation shortfall",
    "",
    `Date: ${date}`,
    `Target: ${targetCount}`,
    `Published: ${publishedCount}`,
    `Missing: ${missingCount}`,
    `Trigger: ${trigger}`,
    `Sources: ${sources}`,
    "",
    "The system did not publish a replacement because no current source item passed the product-specific relevance and compliance checks."
  ].join("\n");
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.NEWS_ALERT_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: `Cowin Supply News shortfall - ${date}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a"><h2>Cowin Supply News automation shortfall</h2><p><strong>Date:</strong> ${escapeHtml(date)}</p><p><strong>Target / Published / Missing:</strong> ${targetCount} / ${publishedCount} / ${missingCount}</p><p><strong>Trigger:</strong> ${escapeHtml(trigger)}</p><p><strong>Sources:</strong> ${escapeHtml(sources)}</p><p>No replacement was published because no current source item passed the product-specific relevance and compliance checks.</p></div>`
  });
  return { sent: true, messageId: info.messageId };
}
