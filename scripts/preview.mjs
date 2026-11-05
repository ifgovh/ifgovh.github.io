/**
 * Local preview for the academic Jekyll pages when Ruby is unavailable.
 * This renders Liquid and Markdown; it does not replace a GitHub Pages build.
 * Install dependencies in .work/node, then run:
 *   node scripts/preview.mjs [--serve] [--port 4173]
 */
import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const localRequire = createRequire(path.join(root, '.work', 'node', 'package.json'));
let Liquid, matter, MarkdownIt;
try {
  ({ Liquid } = localRequire('liquidjs'));
  matter = localRequire('gray-matter');
  MarkdownIt = localRequire('markdown-it');
} catch {
  console.error('Install preview dependencies first: pnpm --dir .work/node add liquidjs gray-matter markdown-it cheerio');
  process.exit(1);
}
const output = path.resolve(root, '.work', 'preview');
if (!output.startsWith(root + path.sep)) throw new Error('Preview output must stay inside this checkout.');
const markdown = new MarkdownIt({ html: true, linkify: true, typographer: false });
const normalHeading = markdown.renderer.rules.heading_open;
markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
  const inline = tokens[index + 1];
  const slug = String(inline?.content || '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
  if (slug) tokens[index].attrSet('id', slug);
  return normalHeading ? normalHeading(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
};

async function walk(directory) {
  let entries;
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(name));
    else result.push(name);
  }
  return result;
}

function yaml(text) { return matter(`---\n${text}\n---\n`).data; }
function cleanText(value = '') { return String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
function escape(value = '') { return String(value).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x])); }

async function build() {
  const config = yaml(await fs.readFile(path.join(root, '_config.yml'), 'utf8'));
  const data = {};
  for (const file of await walk(path.join(root, '_data'))) {
    if (!/\.(?:json|ya?ml)$/i.test(file)) continue;
    const segments = path.relative(path.join(root, '_data'), file).replace(/\.(?:json|ya?ml)$/i, '').split(path.sep);
    let target = data;
    for (const segment of segments.slice(0, -1)) target = target[segment] ||= {};
    const text = await fs.readFile(file, 'utf8');
    target[segments.at(-1)] = file.endsWith('.json') ? JSON.parse(text) : yaml(text);
  }
  const site = { ...config, data, time: new Date(), pages: [], posts: [], job: [], publications: [], talks: [], teaching: [], github: { url: config.url } };
  const engine = new Liquid({ root: path.join(root, '_includes'), extname: '', jekyllInclude: true, strictFilters: false, strictVariables: false, cache: false });
  const baseurl = String(config.baseurl || '').replace(/\/$/, '');
  const relativeUrl = value => {
    const input = String(value ?? '');
    return `${baseurl}/${input.replace(/^\//, '')}`;
  };
  engine.registerFilter('relative_url', relativeUrl);
  engine.registerFilter('absolute_url', value => /^(?:https?:)?\/\//.test(String(value)) ? value : `${String(config.url || '').replace(/\/$/, '')}${relativeUrl(value)}`);
  engine.registerFilter('markdownify', value => markdown.render(String(value ?? '')));
  engine.registerFilter('jsonify', value => JSON.stringify(value));
  engine.registerFilter('where_exp', async (array, variable, expression) => {
    const result = [];
    for (const item of array || []) {
      if ((await engine.parseAndRender(`{% if ${expression} %}yes{% endif %}`, { site, [variable]: item })).trim()) result.push(item);
    }
    return result;
  });
  engine.registerFilter('number_of_words', value => cleanText(value).split(/\s+/).filter(Boolean).length);
  engine.registerFilter('xml_escape', escape);
  engine.registerFilter('normalize_whitespace', value => String(value ?? '').replace(/\s+/g, ' ').trim());
  engine.registerFilter('date_to_xmlschema', value => new Date(value).toISOString());
  engine.registerFilter('slugify', value => cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''));

  const documents = [];
  for (const directory of ['_pages', '_posts', '_job']) {
    if (directory === '_job' && config.collections?.job?.output === false) continue;
    for (const file of await walk(path.join(root, directory))) {
      if (!/\.(?:html|md|markdown)$/i.test(file)) continue;
      const raw = await fs.readFile(file, 'utf8');
      if (!raw.startsWith('---')) continue;
      const parsed = matter(raw);
      const isPost = directory === '_posts';
      const isJob = directory === '_job';
      const type = isPost ? 'posts' : isJob ? 'job' : 'pages';
      const relativePath = path.relative(root, file).replaceAll(path.sep, '/');
      if ((config.exclude || []).some(item => relativePath === item || relativePath.startsWith(item + '/'))) continue;
      const defaults = {};
      for (const rule of config.defaults || []) {
        if (rule.scope?.type && rule.scope.type !== type) continue;
        if (rule.scope?.path && !relativePath.startsWith(rule.scope.path)) continue;
        Object.assign(defaults, rule.values || {});
      }
      const info = { ...defaults, ...parsed.data, ...(isPost ? { collection: 'posts' } : {}) };
      const name = path.basename(file).replace(/\.(?:html|md|markdown)$/i, '');
      info.url = info.permalink || (isPost ? `/posts/${name.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/` : isJob ? `/job/${name}/` : `/${name}/`);
      info.path = path.relative(root, file).replaceAll(path.sep, '/');
      info.date = info.date || (isPost ? new Date(name.slice(0, 10)) : undefined);
      info.description = info.description || cleanText(info.excerpt || config.description);
      info.excerpt = info.excerpt || cleanText(parsed.content.split(/\n\s*\n/)[0]);
      if (isPost) site.posts.push(info);
      else if (isJob) site.job.push(info);
      else site.pages.push(info);
      documents.push({ file, body: parsed.content, info, isPost, isJob });
    }
  }
  site.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const layouts = new Map();
  async function layout(name) {
    if (!layouts.has(name)) layouts.set(name, matter(await fs.readFile(path.join(root, '_layouts', `${name}.html`), 'utf8')));
    return layouts.get(name);
  }
  async function renderLayout(name, content, context, trail = []) {
    if (trail.includes(name)) throw new Error(`Circular layout chain: ${[...trail, name].join(' -> ')}`);
    const template = await layout(name);
    const html = await engine.parseAndRender(template.content, { ...context, content, layout: template.data });
    return template.data.layout ? renderLayout(template.data.layout, html, context, [...trail, name]) : html;
  }

  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  for (const directory of ['assets', 'images', 'files', 'posts']) {
    try { await fs.cp(path.join(root, directory), path.join(output, directory), { recursive: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  // Jekyll publishes static files nested in collections at their source path.
  for (const file of await walk(path.join(root, '_posts'))) {
    if (/\.(?:html|md|markdown)$/i.test(file)) continue;
    const destination = path.join(output, '_posts', path.relative(path.join(root, '_posts'), file));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(file, destination);
  }
  let rendered = 0, skipped = 0;
  const manifest = [];
  for (const document of documents) {
    const { info, file, body, isPost, isJob } = document;
    const ownLayout = ['academic', 'project', 'writing'].includes(info.layout);
    // Demo pages from the retained AcademicPages template use a different theme.
    if (!ownLayout && !isPost && !isJob && !['/404.html', '/404/'].includes(info.url)) { skipped++; continue; }
    const page = { ...info, section: info.section || (isPost ? 'writing' : isJob ? 'join' : undefined) };
    const context = { site, page, jekyll: { environment: 'development' } };
    // Jekyll carries layout assigns into its parent. Supply the same project object.
    if (page.paper_id && Array.isArray(data.papers)) context.paper = data.papers.find(paper => paper.id === page.paper_id);
    let content = await engine.parseAndRender(body, context);
    if (/\.(?:md|markdown)$/i.test(file)) content = markdown.render(content);
    let html;
    if (ownLayout) html = await renderLayout(info.layout, content, context);
    else {
      content = `<article class="wrap prose"><header class="page-intro"><p class="eyebrow">${isJob ? 'Join us' : 'Writing'}</p><h1>${escape(info.title)}</h1></header>${content}</article>`;
      html = await renderLayout('academic', content, context);
    }
    const route = String(info.url).replace(/^\//, '');
    const destination = path.join(output, path.extname(route) ? route : path.join(route, 'index.html'));
    if (!destination.startsWith(output + path.sep)) throw new Error(`Unsafe permalink: ${info.url}`);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, html, 'utf8');
    manifest.push({ url: info.url, source: info.path });
    for (const redirect of [].concat(info.redirect_from || [])) {
      const redirectRoute = String(redirect).replace(/^\//, '');
      const target = path.join(output, path.extname(redirectRoute) ? redirectRoute : path.join(redirectRoute, 'index.html'));
      if (!target.startsWith(output + path.sep)) throw new Error(`Unsafe redirect: ${redirect}`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Redirecting</title><meta name="description" content="This page has moved."><meta http-equiv="refresh" content="0;url=${escape(info.url)}"><link rel="canonical" href="${escape(config.url + info.url)}"></head><body><a href="${escape(info.url)}">Continue to ${escape(info.title)}</a></body></html>`);
    }
    rendered++;
  }
  const entries = site.posts.map(post => `<entry><title>${escape(post.title)}</title><link href="${escape(config.url + post.url)}"/><id>${escape(config.url + post.url)}</id><updated>${new Date(post.date).toISOString()}</updated><summary>${escape(post.excerpt)}</summary></entry>`).join('');
  await fs.writeFile(path.join(output, 'feed.xml'), `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${escape(config.title)}</title><id>${escape(config.url)}</id><updated>${new Date().toISOString()}</updated>${entries}</feed>`);
  await fs.writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${manifest.map(page => `<url><loc>${escape(config.url + page.url)}</loc></url>`).join('')}</urlset>`);
  await fs.writeFile(path.join(output, 'preview-manifest.json'), JSON.stringify({ generated: new Date().toISOString(), rendered, skippedLegacyTemplatePages: skipped, pages: manifest }, null, 2));
  console.log(`Preview: ${rendered} pages rendered to ${path.relative(root, output)} (${skipped} unused legacy template pages omitted).`);
  console.log('Verification limit: LiquidJS/Markdown preview; run GitHub Pages/Jekyll to verify the production build.');
}

await build();
if (process.argv.includes('--serve')) {
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
  const server = http.createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      let file = path.resolve(output, '.' + pathname);
      if (file !== output && !file.startsWith(output + path.sep)) { response.writeHead(403).end(); return; }
      let stat = await fs.stat(file);
      if (stat.isDirectory()) { file = path.join(file, 'index.html'); stat = await fs.stat(file); }
      if (!stat.isFile()) throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
      response.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(await fs.readFile(file));
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Page not found in the local preview.' : 'Preview server error.');
    }
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  console.log(`Local: http://127.0.0.1:${port}`);
  let timer, building = false, pending = false;
  async function rebuild() {
    if (building) { pending = true; return; }
    building = true;
    try { await build(); } catch (error) { console.error(error.stack || error); }
    building = false;
    if (pending) { pending = false; await rebuild(); }
  }
  for (const directory of ['_pages', '_layouts', '_includes', '_data', '_posts', '_job', 'assets', 'images', 'posts']) {
    watch(path.join(root, directory), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 200); });
  }
  watch(path.join(root, '_config.yml'), () => { clearTimeout(timer); timer = setTimeout(rebuild, 200); });
}
