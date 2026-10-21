// Minimalny, bezpieczny Markdown dla odpowiedzi Chleba: akapity, listy, **pogrubienie**, *kursywa*.
// Buduje elementy Reacta — żadnego wstrzykiwania HTML.
function inline(text, keyBase) {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <strong key={`${keyBase}-${i++}`}>{m[1]}</strong> : <em key={`${keyBase}-${i++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }) {
  const blocks = [];
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', lines: para });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet ?? numbered)[1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.replace(/^#{1,6}\s+/, ''));
    }
  }
  flushPara();
  flushList();

  return blocks.map((b, bi) => {
    if (b.type === 'p') {
      return (
        <p key={bi}>
          {b.lines.map((l, li) => (
            <span key={li}>
              {li ? <br /> : null}
              {inline(l, `${bi}-${li}`)}
            </span>
          ))}
        </p>
      );
    }
    const Tag = b.type;
    return (
      <Tag key={bi}>
        {b.items.map((item, ii) => (
          <li key={ii}>{inline(item, `${bi}-${ii}`)}</li>
        ))}
      </Tag>
    );
  });
}
