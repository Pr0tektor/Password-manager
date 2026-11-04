import { readFile, writeFile } from 'node:fs/promises';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function inline(value) {
  return escape(value).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
export function renderMarkdown(source, language) {
  const blocks = source.trim().split(/\r?\n\s*\r?\n/);
  return `<section id="${language}" lang="${language}">\n` + blocks.map(block => {
    const heading = block.match(/^(#{1,3}) (.+)$/);
    if (heading) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    const lines = block.split(/\r?\n/);
    if (lines.every(line => /^\d+\. /.test(line))) return '<ol>' + lines.map(line => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('') + '</ol>';
    if (lines.every(line => /^- /.test(line))) return '<ul>' + lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('') + '</ul>';
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('\n') + '\n</section>';
}
const [ru, en] = await Promise.all(['RU', 'EN'].map(language => readFile(new URL(`../docs/USER_GUIDE_${language}.md`, import.meta.url), 'utf8')));
const html = `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'"><title>Менеджер паролей / Password Manager — руководство / guide</title><link rel="stylesheet" href="../styles.css"></head><body><main class="guide"><nav aria-label="Language / Язык"><a href="#ru">Русский</a><a href="#en">English</a><a href="../">Открыть приложение / Open app</a></nav>${renderMarkdown(ru, 'ru')}\n${renderMarkdown(en, 'en')}</main></body></html>\n`;
await writeFile(new URL('../docs/guide.html', import.meta.url), html);
console.log('Built bilingual HTML guide.');
