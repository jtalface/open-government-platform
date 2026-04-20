import type { ReactNode } from "react";

/**
 * Inline `**bold**` only (no full markdown parser). Unmatched `**` stays literal.
 */
function renderInlineBold(text: string, keyPrefix: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    parts.push(
      <strong key={`${keyPrefix}-b-${n++}`} className="font-semibold text-gray-900">
        {m[1]}
      </strong>
    );
    last = re.lastIndex;
  }
  if (last === 0 && parts.length === 0) {
    return text;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return <>{parts}</>;
}

/**
 * Renders simple policy-style markdown: preamble paragraphs and `##` sections with body paragraphs.
 * Used by public legal pages (privacy, terms).
 */
export function PolicyMarkdownBody({ markdown }: { markdown: string }) {
  const segments = markdown.split(/\n(?=## )/);

  return segments.map((segment, i) => {
    const s = segment.trim();
    if (!s) return null;

    if (s.startsWith("## ")) {
      const nl = s.indexOf("\n");
      const heading = nl === -1 ? s.slice(3).trim() : s.slice(3, nl).trim();
      const body = nl === -1 ? "" : s.slice(nl + 1).trim();
      return (
        <section key={i} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{heading}</h2>
          {body.split(/\n\n+/).map((p, j) => (
            <p
              key={j}
              className="text-gray-700 leading-relaxed mb-4 last:mb-0 whitespace-pre-line"
            >
              {renderInlineBold(p, `s-${i}-p-${j}`)}
            </p>
          ))}
        </section>
      );
    }

    return (
      <div key={i} className="mb-6 text-gray-700 leading-relaxed space-y-4">
        {s.split(/\n\n+/).map((p, j) => (
          <p key={j} className="whitespace-pre-line">
            {renderInlineBold(p, `pre-${i}-p-${j}`)}
          </p>
        ))}
      </div>
    );
  });
}
