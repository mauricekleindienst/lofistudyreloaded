// Minimal, safe Markdown for notes: headings, lists, quotes, rules, inline
// bold/italic/underline/strike/code. Everything is HTML-escaped first, so the
// output can go into dangerouslySetInnerHTML.

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$2</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const [lineNo, raw] of lines.entries()) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;

    if (!line.trim()) {
      flushParagraph();
      closeList();
    } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushParagraph();
      closeList();
      const level = m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      closeList();
      out.push('<hr>');
    } else if ((m = line.match(/^\s*>\s?(.*)$/))) {
      flushParagraph();
      closeList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushParagraph();
      const kind = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      const task = kind === 'ul' && m[1].match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        const done = task[1] !== ' ';
        out.push(
          `<li class="task${done ? ' done' : ''}"><input type="checkbox" data-line="${lineNo}"${done ? ' checked' : ''} aria-label="Toggle item"> <span>${inline(task[2])}</span></li>`
        );
      } else out.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  closeList();
  return out.join('');
}

/** Flips the `- [ ]` checkbox on the given line. */
export function toggleTask(source: string, lineNo: number): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const line = lines[lineNo];
  if (line === undefined) return source;
  lines[lineNo] = line.replace(/^(\s*[-*+]\s+)\[([ xX])\]/, (_, pre: string, mark: string) => `${pre}[${mark === ' ' ? 'x' : ' '}]`);
  return lines.join('\n');
}

export function countWords(source: string): number {
  return (source.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/** Plain-text excerpt for note cards. */
export function stripMarkdown(source: string, max = 150): string {
  const text = source
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[[xX]\]\s+/gm, '☑ ')
    .replace(/^\s*[-*+]\s+\[ \]\s+/gm, '☐ ')
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, '• ')
    .replace(/^(-{3,}|\*{3,})$/gm, '')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/(^|\s)\*(\S[^*]*?)\*/g, '$1$2')
    .replace(/\s*\n+\s*/g, ' · ')
    .replace(/^ · | · $/g, '')
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
