import * as React from 'react';

export function render(text: string) {
  const segments: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    if (text.charAt(i) === '^') {
      const color = text.substr(i + 1, 6);
      i += 8;
      const end = text.indexOf('^p', i);
      const s = text.substring(i, end);
      segments.push(<span style={{ color: `#${color}` }} key={segments.length}>{s}</span>);
      i = end + 2;
    } else if (text.charAt(i) === '\n') {
      segments.push(<br key={segments.length} />);
      i++;
    } else {
      let end = text.substring(i).search('\\^|\n');
      end = end < 0 ? text.length : i + end;
      const s = text.substring(i, end);
      segments.push(s);
      i = end;
    }
  }
  return <>{...segments}</>;
}