const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const splitMetric = line => {
  const separator = line.indexOf(' - ');
  if (separator < 0) return null;
  return { label: line.slice(0, separator).trim(), value: line.slice(separator + 3).trim() };
};

function renderSummary(lines) {
  const repName = lines[0] || 'Daily Report';
  const metrics = [];
  const notes = [];

  for (const line of lines.slice(1)) {
    const tallyMetric = line.match(/^([A-Z])-(.*)$/);
    const metric = tallyMetric ? { label: tallyMetric[1], value: tallyMetric[2].trim() } : splitMetric(line);
    if (!metric) continue;
    if (metric.label.toLowerCase() === 'note') notes.push(metric.value);
    else metrics.push(metric);
  }

  const cells = metrics.map(({ label, value }) => `
    <td width="${Math.floor(100 / Math.max(metrics.length, 1))}%" valign="top" style="padding:4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f2e8;border:1px solid #d6cfc1;">
        <tr><td align="center" style="padding:10px 4px 2px;color:#66748a;font-size:11px;font-weight:bold;">${escapeHtml(label)}</td></tr>
        <tr><td align="center" style="padding:0 4px 10px;color:#0a1f3d;font-size:21px;font-weight:bold;">${escapeHtml(value)}</td></tr>
      </table>
    </td>`).join('');

  const noteRows = notes.map(note => `<tr><td colspan="${Math.max(metrics.length, 1)}" style="padding:8px 12px;background:#fff8e9;color:#5f5136;font-size:13px;">Note: ${escapeHtml(note)}</td></tr>`).join('');
  const summary = metrics.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr>${noteRows}</table>`
    : notes.map(note => `<p style="margin:10px 0 0;padding:9px 12px;background:#fff8e9;color:#5f5136;font-size:13px;">${escapeHtml(note)}</p>`).join('');

  return `<tr><td style="padding:18px 20px 8px;"><h2 style="margin:0;color:#0a1f3d;font-size:19px;">${escapeHtml(repName)}</h2></td></tr>
    <tr><td style="padding:0 16px 16px;">${summary}</td></tr>`;
}

function renderSection(lines) {
  const firstLine = lines[0] || 'Report';
  const headingMetric = splitMetric(firstLine);
  const title = headingMetric ? headingMetric.label : firstLine;
  const rows = [];
  if (headingMetric) rows.push({ label: 'Total', value: headingMetric.value });

  for (const line of lines.slice(1)) {
    const metric = splitMetric(line);
    if (metric) rows.push(metric);
    else if (line.trim()) rows.push({ label: '', value: line.trim() });
  }

  const rowHtml = rows.map(({ label, value }) => {
    const isNote = label.toLowerCase() === 'note';
    return isNote
      ? `<tr><td colspan="2" style="padding:8px 10px;border-bottom:1px solid #e9e4da;background:#fbf7ec;color:#5d4a23;font-size:13px;">Note: ${escapeHtml(value)}</td></tr>`
      : `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e9e4da;color:#3a4a63;font-size:13px;">${label ? escapeHtml(label) : '&nbsp;'}</td>
          <td align="right" style="padding:8px 10px;border-bottom:1px solid #e9e4da;color:#0a1f3d;font-size:13px;font-weight:bold;">${escapeHtml(value)}</td>
        </tr>`;
  }).join('');

  return `<tr><td style="padding:4px 16px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #d6cfc1;">
      <tr><td colspan="2" style="padding:10px 12px;background:#0a1f3d;color:#ffffff;font-size:14px;font-weight:bold;">${escapeHtml(title)}</td></tr>
      ${rowHtml}
    </table>
  </td></tr>`;
}

export function buildEmailHtml(subject, body) {
  const sections = String(body).replaceAll('\r\n', '\n').trim().split(/\n\s*\n/).filter(Boolean);
  const first = (sections.shift() || '').split('\n').map(line => line.trim()).filter(Boolean);
  if (first.length === 1 && first[0] === first[0].toUpperCase() && sections.length) {
    first.push(...sections.shift().split('\n').map(line => line.trim()).filter(Boolean));
  }
  const details = sections.map(section => renderSection(section.split('\n').map(line => line.trim()).filter(Boolean))).join('');

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f2e8;font-family:Arial,Helvetica,sans-serif;color:#3a4a63;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f2e8;">
      <tr><td align="center" style="padding:24px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #d6cfc1;">
          <tr><td style="padding:18px 20px;background:#0a1f3d;border-bottom:4px solid #c9a45c;color:#ffffff;">
            <div style="font-size:11px;letter-spacing:1px;font-weight:bold;">ASG &nbsp;|&nbsp; DAILY DRAPS</div>
            <div style="padding-top:8px;font-size:13px;color:#d7deea;">${escapeHtml(subject)}</div>
          </td></tr>
          ${renderSummary(first)}
          ${details}
          <tr><td style="padding:8px 20px 18px;color:#66748a;font-size:11px;">Daily Results and Activity Performance Summary</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
