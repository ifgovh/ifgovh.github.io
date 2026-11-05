import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// These figures explain the sequence of ideas in each paper. Every mark is
// schematic: none of the curves, point positions, or rasters represents data.
const root = fileURLToPath(new URL('../', import.meta.url));
const palette = {
  ink: '#273432', muted: '#777d76', line: '#d9ddd5', faint: '#ecefe8',
  paper: '#faf9f6', white: '#ffffff', red: '#862237', rose: '#ead6d9',
  teal: '#457975', tealPale: '#dce9e5', ochre: '#b4894a',
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[ch]));
const line = (x1, y1, x2, y2, color = palette.line, width = 1.5, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const dot = (x, y, r = 4, color = palette.red, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${extra}/>`;
const curve = (d, color = palette.red, width = 2, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const rect = (x, y, width, height, fill = palette.faint, extra = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
const smallArrow = (x1, y1, x2, y2, color = palette.muted) =>
  line(x1, y1, x2, y2, color, 1.5) + curve(`M${x2 - 5},${y2 - 4} L${x2},${y2} L${x2 - 5},${y2 + 4}`, color, 1.5);

const motifs = {
  network() {
    const nodes = [[14,44],[47,14],[45,72],[83,37],[115,11],[118,72],[157,42],[81,86]];
    const edges = [[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[2,7],[3,4],[3,5],[3,6],[4,6],[5,6],[5,7]];
    return edges.map(([a,b], i) => line(...nodes[a], ...nodes[b], i % 3 ? palette.line : palette.teal, i % 3 ? 1.5 : 2)).join('') +
      nodes.map(([x,y], i) => dot(x,y,i === 3 ? 8 : 5,i === 3 ? palette.red : i % 2 ? palette.teal : palette.ochre, 'stroke="#ffffff" stroke-width="1.5"')).join('');
  },
  waves() {
    let out = '';
    [22,46,70].forEach((baseline, index) => {
      out += line(0,baseline,170,baseline,palette.faint,1);
      let d = '';
      for (let x = 0; x <= 170; x += 2) {
        const y = baseline + 13 * Math.sin(x / 15 - index * .85);
        d += `${x ? 'L' : 'M'}${x},${y.toFixed(2)} `;
      }
      out += curve(d, [palette.red,palette.teal,palette.ochre][index], 2);
    });
    return out + smallArrow(132,91,165,91);
  },
  grid() {
    let out = '';
    for (let x = 12; x <= 156; x += 24) out += line(x,2,x,94,palette.faint,1);
    for (let y = 4; y <= 94; y += 23) out += line(12,y,156,y,palette.faint,1);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 24 + col * 27 + (row % 2 ? 13 : 0);
        const y = 13 + row * 24;
        if (x < 165) out += dot(x,y,7,palette.tealPale) + dot(x,y,2.4,palette.teal);
      }
    }
    out += curve('M18,76 C40,65 39,46 62,47 S90,72 107,48 S130,15 150,25',palette.red,2.2,'stroke-dasharray="4 4"');
    return out + dot(18,76,3) + dot(150,25,4);
  },
  hierarchy() {
    const top = [85,9], middle = [[28,42],[85,42],[142,42]], bottom = [[13,83],[43,83],[70,83],[100,83],[127,83],[157,83]];
    let out = middle.map(p => line(...top,...p,palette.teal,1.7)).join('');
    bottom.forEach((p,i) => { out += line(...middle[Math.floor(i/2)],...p,palette.line,1.5); });
    out += dot(...top,8,palette.red);
    out += middle.map(p => rect(p[0]-8,p[1]-6,16,12,palette.teal,'rx="2"')).join('');
    out += bottom.map(p => dot(...p,5,palette.ochre)).join('');
    return out;
  },
  latent() {
    let out = line(30,76,162,76,palette.line,1.5) + line(30,76,30,0,palette.line,1.5) + line(30,76,4,94,palette.line,1.5);
    out += curve('M31,59 C51,14 108,9 142,39 C162,62 100,79 63,61 C33,47 48,20 80,23',palette.teal,1.8);
    const pts = [[38,51],[48,36],[61,27],[79,22],[99,25],[118,31],[135,40],[142,51],[130,61],[109,65],[87,63],[67,57],[52,45],[63,33],[81,30],[97,36]];
    pts.forEach((p,i) => { out += dot(...p,2.8,i < 8 ? palette.red : palette.ochre); });
    return out;
  },
  learning() {
    let out = '';
    [[73,44,66,39],[77,46,47,28],[83,46,29,17],[90,47,13,7]].forEach(([x,y,rx,ry],i) => {
      out += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${i < 2 ? palette.line : palette.tealPale}" stroke-width="1.5" transform="rotate(-13 ${x} ${y})"/>`;
    });
    const points = [[15,18],[37,67],[62,31],[78,55],[87,42],[92,47]];
    out += curve(points.map((p,i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' '),palette.red,2);
    points.forEach((p,i) => { out += dot(...p,i === points.length-1 ? 4 : 2.7,palette.red); });
    return out;
  },
  vision() {
    let out = rect(3,12,68,68,palette.faint,'rx="2" stroke="#d9ddd5"');
    out += curve('M6,63 L23,41 L37,54 L51,29 L68,60',palette.muted,1.5);
    out += dot(22,28,6,palette.ochre);
    out += rect(22,32,31,30,'none',`stroke="${palette.red}" stroke-width="1.5"`);
    out += line(53,32,110,16,palette.line,1) + line(53,62,110,78,palette.line,1);
    out += `<circle cx="135" cy="47" r="33" fill="${palette.tealPale}" stroke="${palette.teal}" stroke-width="1.5"/>`;
    [[119,31,131,62],[128,24,144,68],[138,23,152,58]].forEach(p => { out += line(...p,palette.teal,4); });
    out += curve('M111,73 Q135,92 158,72',palette.red,1.5);
    return out;
  },
  robot() {
    let out = curve('M5,78 C24,78 27,64 42,61 S87,79 103,54 S139,35 162,19',palette.teal,1.6,'stroke-dasharray="4 4"');
    out += rect(23,21,18,16,palette.faint,`stroke="${palette.line}"`) + rect(118,70,20,15,palette.faint,`stroke="${palette.line}"`);
    out += curve('M82,39 L115,5 Q141,22 146,47 L99,57',palette.ochre,1.2,'stroke-dasharray="3 3"');
    out += rect(62,37,40,30,palette.white,`rx="8" stroke="${palette.ink}" stroke-width="1.7"`);
    out += rect(56,42,7,21,palette.ink,'rx="2"') + rect(101,42,7,21,palette.ink,'rx="2"');
    out += dot(82,50,6,palette.red) + line(82,37,82,28,palette.ink,1.5) + dot(82,25,3,palette.ochre);
    out += dot(162,19,4,palette.red);
    return out;
  },
  spectrum() {
    let out = line(8,84,168,84,palette.muted,1.3) + line(8,84,8,6,palette.muted,1.3);
    const bars = [8,13,22,39,68,43,21,14,11,24,44,33,17,9];
    bars.forEach((h,i) => { out += rect(18+i*10,84-h,5,h,i < 7 ? palette.teal : palette.rose); });
    out += curve('M16,78 C32,78 42,70 51,43 S64,5 72,31 S83,77 96,73 S108,38 121,40 S139,76 157,79',palette.red,2.1);
    return out;
  },
  spikes() {
    const times = [[8,26,45,48,88,121,137],[16,44,69,90,95,123,158],[7,35,47,84,91,126,148],[24,42,63,87,104,125,150],[12,48,75,88,122,140,160]];
    let out = rect(82,0,14,86,palette.tealPale) + rect(119,0,12,86,palette.rose);
    times.forEach((row,i) => {
      const y = 8+i*17;
      out += line(0,y+5,170,y+5,palette.faint,1);
      row.forEach(t => { out += line(t,y,t,y+9,i % 2 ? palette.teal : palette.red,1.7); });
    });
    return out + smallArrow(7,94,165,94);
  },
  memory() {
    let out = '';
    [0,63,126].forEach((x,i) => {
      out += rect(x,32,43,43,palette.white,`rx="2" stroke="${palette.line}"`);
      [[8,8],[22,8],[8,22],[22,22]].forEach(([dx,dy],j) => { out += rect(x+dx,32+dy,9,9,(j+i)%3 ? palette.tealPale : palette.red,'rx="1"'); });
    });
    out += smallArrow(47,53,59,53) + smallArrow(110,53,122,53);
    out += curve('M146,24 C146,-1 21,-1 21,24',palette.red,1.8);
    out += curve('M17,19 L21,25 L25,19',palette.red,1.5);
    return out;
  },
  transfer() {
    let out = '';
    const nodes = [[5,45],[27,15],[29,75],[56,44]];
    [[0,1],[0,2],[1,2],[1,3],[2,3]].forEach(([a,b]) => { out += line(...nodes[a],...nodes[b],palette.line,1.5); });
    nodes.forEach((p,i) => { out += dot(...p,5,i === 1 || i === 3 ? palette.red : palette.teal); });
    [[0,1],[0,2],[1,2],[1,3],[2,3]].forEach(([a,b]) => { out += line(nodes[a][0]+110,nodes[a][1],nodes[b][0]+110,nodes[b][1],palette.line,1.5); });
    nodes.forEach((p,i) => { out += dot(p[0]+110,p[1],5,i === 1 || i === 3 ? palette.red : palette.ochre); });
    out += smallArrow(66,45,103,45,palette.red);
    out += curve('M32,8 C53,-5 124,-5 140,8',palette.red,1.2,'stroke-dasharray="3 4"');
    return out;
  },
};

function wrapWords(value, limit, maxLines = 2) {
  const words = String(value).trim().split(/\s+/);
  const rows = [];
  let row = '';
  for (const word of words) {
    if (row && row.length + word.length + 1 > limit && rows.length < maxLines - 1) {
      rows.push(row);
      row = word;
    } else row += (row ? ' ' : '') + word;
  }
  if (row) rows.push(row);
  return rows;
}

export function makeDiagram(paper) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(paper.id ?? '')) throw new Error(`Unsafe or missing paper id: ${paper.id}`);
  if (!Array.isArray(paper.diagram) || paper.diagram.length !== 3 || paper.diagram.some(label => typeof label !== 'string' || !label.trim())) {
    throw new Error(`${paper.id}: diagram must contain three nonempty labels`);
  }
  if (!Array.isArray(paper.diagram_icons) || paper.diagram_icons.length !== 3 || paper.diagram_icons.some(icon => !Object.hasOwn(motifs, icon))) {
    throw new Error(`${paper.id}: diagram_icons must contain three supported motif names`);
  }
  const title = paper.idea_title || paper.title;
  const heading = wrapWords(title, 67);
  const titleSize = heading.some(row => row.length > 74) ? 19 : 23;
  const labels = paper.diagram.map(label => wrapWords(label, 28));
  const description = `${paper.diagram_caption || title} Conceptual schematic, not experimental data. Stages: ${paper.diagram.join('; ')}.`;
  const panels = labels.map((rows,index) => {
    const x = 28 + index * 292;
    const labelSize = rows.some(row => row.length > 32) ? 13 : 15;
    const labelY = rows.length > 1 ? 260 : 269;
    return `<g>
      <rect x="${x}" y="104" width="260" height="194" rx="3" fill="${palette.white}" stroke="${palette.line}"/>
      <text x="${x+18}" y="128" class="stage">0${index+1}</text>
      <g transform="translate(${x+45},143)" aria-hidden="true">${motifs[paper.diagram_icons[index]]()}</g>
      <text x="${x+130}" y="${labelY}" text-anchor="middle" class="label" font-size="${labelSize}">${rows.map((row,i) => `<tspan x="${x+130}" dy="${i ? 20 : 0}">${esc(row)}</tspan>`).join('')}</text>
    </g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="340" viewBox="0 0 900 340" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(description)}</desc>
  <style>.title{font-family:Georgia,'Times New Roman',serif;font-weight:400;fill:${palette.ink};letter-spacing:-.3px}.stage{font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;fill:${palette.red}}.label{font-family:Arial,sans-serif;fill:${palette.ink}}.note{font-family:Arial,sans-serif;font-size:10px;letter-spacing:.25px;fill:${palette.muted}}</style>
  <rect width="900" height="340" fill="${palette.paper}"/>
  <text x="28" y="${heading.length > 1 ? 34 : 49}" class="title" font-size="${titleSize}">${heading.map((row,i) => `<tspan x="28" dy="${i ? 28 : 0}">${esc(row)}</tspan>`).join('')}</text>
  <line x1="28" y1="83" x2="872" y2="83" stroke="${palette.line}"/>
  ${panels}
  ${smallArrow(294,202,313,202,palette.red)}
  ${smallArrow(586,202,605,202,palette.red)}
  <text x="28" y="323" class="note">CONCEPTUAL SCHEMATIC · NOT EXPERIMENTAL DATA</text>
</svg>\n`;
}

async function main() {
  const sourcePath = path.join(root, '_data', 'papers.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const papers = Array.isArray(source) ? source : source.papers;
  if (!Array.isArray(papers)) throw new Error('papers.json must be an array or an object with a papers array');
  const diagrams = papers.map(paper => ({ id: paper.id, svg: makeDiagram(paper) }));
  const unique = new Set(diagrams.map(diagram => diagram.id));
  if (unique.size !== diagrams.length) throw new Error('Duplicate paper ids in papers.json');
  const outputDir = path.join(root, 'assets', 'images', 'research');
  await fs.mkdir(outputDir, { recursive: true });
  for (const diagram of diagrams) await fs.writeFile(path.join(outputDir, `${diagram.id}.svg`), diagram.svg, 'utf8');
  console.log(`Generated ${diagrams.length} conceptual SVG diagrams in assets/images/research/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
