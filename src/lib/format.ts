const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(
    d.getUTCFullYear(),
  ).slice(2)}`;
}

export function fmtBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function v(tag: string | undefined): string {
  return (tag || '').replace(/^v/, '');
}

export function truncate(text: string, max = 220): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (raw: string) =>
  escapeHtml(raw)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');

/**
 * A deliberately small, safe renderer for GitHub release notes: headings,
 * bullets and paragraphs. It escapes first, so nothing in a release body can
 * inject markup into the page.
 */
export function releaseNotes(body: string): string {
  const lines = (body || '').replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  let table: string[] | null = null;

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = [];
  };
  const flush = () => {
    flushPara();
    flushList();
  };
  const flushCode = () => {
    if (!code) return;
    out.push(`<pre class="release__code"><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    code = null;
  };
  const flushTable = () => {
    if (!table) return;
    out.push(`<pre class="release__code release__table"><code>${escapeHtml(table.join('\n'))}</code></pre>`);
    table = null;
  };

  for (const raw of lines) {
    const text = raw.trim();

    if (text.startsWith('```')) {
      flush();
      flushTable();
      if (code) flushCode();
      else code = [];
      continue;
    }
    if (code) {
      code.push(raw.replace(/\s+$/, ''));
      continue;
    }

    if (text.startsWith('|')) {
      flush();
      flushCode();
      table = table || [];
      table.push(text);
      continue;
    }
    if (table) {
      flushTable();
    }

    if (!text) {
      flush();
      continue;
    }
    const heading = text.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      flush();
      out.push(`<p class="release__h">${inline(heading[1])}</p>`);
      continue;
    }
    const bullet = text.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
      continue;
    }
    flushList();
    para.push(text);
  }
  flush();
  flushCode();
  flushTable();
  return out.join('');
}
