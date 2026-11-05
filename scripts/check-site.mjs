/** Check every generated local href/src and fragment in the preview output. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, '.work', 'node', 'package.json'));
const { load } = require('cheerio');
const directory = path.resolve(process.argv[2] || path.join(root, '.work', 'preview'));
const origin = 'https://ifgovh.github.io';

async function walk(folder) {
  const result = [];
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else result.push(file);
  }
  return result;
}
const files = await walk(directory);
const known = new Set(files.map(file => path.resolve(file).toLowerCase()));
const htmlFiles = files.filter(file => file.endsWith('.html'));
const documents = new Map();
const issues = [];
let checked = 0;
function route(file) { return '/' + path.relative(directory, file).replaceAll(path.sep, '/').replace(/index\.html$/, ''); }
function problem(file, message) { issues.push(`${route(file)}: ${message}`); }
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const $ = load(html);
  const ids = new Set();
  $('[id]').each((_, element) => {
    const id = $(element).attr('id');
    if (ids.has(id)) problem(file, `Duplicate ID #${id}`);
    ids.add(id);
  });
  if (!$('title').text().trim()) problem(file, 'Missing title');
  if (!$('meta[name="description"]').attr('content')?.trim()) problem(file, 'Missing meta description');
  if (!$('html').attr('lang')) problem(file, 'Missing document language');
  if (/\{%|\{\{/.test(html)) problem(file, 'Unrendered Liquid expression');
  documents.set(file.toLowerCase(), { $, ids });
}
for (const [fileKey, { $ }] of documents) {
  const file = files.find(candidate => candidate.toLowerCase() === fileKey);
  const current = new URL(route(file), origin);
  for (const element of $('[href], [src]').toArray()) {
    for (const attribute of ['href', 'src']) {
      if (!$(element).attr(attribute)) continue;
      const value = $(element).attr(attribute).trim();
      if (/^(?:data:|tel:|javascript:)/i.test(value)) continue;
      if (value.startsWith('mailto:')) {
        const email = value.slice(7).split('?')[0];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problem(file, `Malformed email link: ${value}`);
        continue;
      }
      let url;
      try { url = new URL(value, current); }
      catch { problem(file, `Invalid ${attribute}: ${value}`); continue; }
      if (url.origin !== origin) continue;
      checked++;
      const pathname = decodeURIComponent(url.pathname);
      const candidates = [path.resolve(directory, '.' + pathname), path.resolve(directory, '.' + pathname, 'index.html')];
      const target = candidates.find(candidate => known.has(candidate.toLowerCase()));
      if (!target) { problem(file, `Missing local ${attribute}: ${value}`); continue; }
      if (url.hash && documents.has(target.toLowerCase())) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (id && !documents.get(target.toLowerCase()).ids.has(id)) problem(file, `Missing fragment ${url.hash} in ${pathname}`);
      }
    }
  }
}
if (issues.length) {
  console.error(`FAILED: ${issues.length} issues across ${htmlFiles.length} pages and ${checked} local links/assets.`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else console.log(`PASS: ${htmlFiles.length} HTML pages; ${checked} local links/assets; titles, descriptions, language, IDs, fragments and email links verified.`);
