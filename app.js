const REPO = 'faryao/public_wiki';
const API = `https://api.github.com/repos/${REPO}`;

const escapeHtml = (value = '') => value.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const titleFromFile = file => file.replace(/\.md$/i, '').split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (match) match[1].split('\n').forEach(line => { const i=line.indexOf(':'); if(i>0) meta[line.slice(0,i).trim()] = line.slice(i+1).trim(); });
  return { meta, body: match ? text.slice(match[0].length) : text };
}

function markdown(source) {
  let s = escapeHtml(source).replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  s = s.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
  s = s.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^[-*] (.+)$/gm,'<li>$1</li>').replace(/((?:<li>.*<\/li>\n?)+)/g,'<ul>$1</ul>');
  s = s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code>$1</code>');
  const links = [];
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    links.push(`<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`);
    return `%%LINK${links.length - 1}%%`;
  });
  s = s.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, url => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`);
  s = s.replace(/%%LINK(\d+)%%/g, (_, index) => links[Number(index)]);
  return s.split(/\n{2,}/).map(block => /^<(h\d|ul|pre|blockquote)/.test(block) ? block : `<p>${block.replace(/\n/g,'<br>')}</p>`).join('');
}

async function getPages() {
  const response = await fetch(`${API}/contents/pages`);
  if (!response.ok) throw new Error('Could not load pages');
  const files = (await response.json()).filter(f => f.name.endsWith('.md'));
  return Promise.all(files.map(async file => {
    const text = await fetch(file.download_url).then(r => r.text());
    const { meta } = parseFrontmatter(text);
    return { ...file, title: meta.title || titleFromFile(file.name) };
  }));
}

async function renderHome() {
  const template = document.querySelector('main').dataset.home;
  if (template) document.querySelector('main').innerHTML = template;
  const grid = document.querySelector('#page-grid');
  try {
    const pages = await getPages();
    const draw = list => grid.innerHTML = list.length ? list.map(p => `<a class="page-card" href="#page=${encodeURIComponent(p.name)}">${escapeHtml(p.title)}</a>`).join('') : '<p class="loading">No matching pages.</p>';
    draw(pages);
    document.querySelector('#search').addEventListener('input', e => { const q=e.target.value.toLowerCase(); draw(pages.filter(p => p.title.toLowerCase().includes(q))); });
  } catch { grid.innerHTML = '<p class="loading">The library could not be loaded. Try refreshing in a moment.</p>'; }
  bindCreate();
}

async function renderPage(filename) {
  const main = document.querySelector('main');
  try {
    const response = await fetch(`${API}/contents/pages/${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    const text = await fetch(data.download_url).then(r => r.text());
    const { meta, body } = parseFrontmatter(text);
    const title = meta.title || titleFromFile(filename);
    document.title = `${title} — Public Wiki`;
    main.innerHTML = `<div class="article-shell"><article class="article"><h1>${escapeHtml(title)}</h1><div class="prose">${markdown(body)}</div></article><aside class="article-aside"><a class="back-link" href="#home">← All pages</a><a href="https://github.com/${REPO}/edit/main/pages/${encodeURIComponent(filename)}" target="_blank">Edit this page ↗</a><a href="https://github.com/${REPO}/commits/main/pages/${encodeURIComponent(filename)}" target="_blank">View history ↗</a><a href="#" data-open-create>Create a new page +</a></aside></div>`;
    bindCreate(); window.scrollTo(0,0);
  } catch { main.innerHTML='<section class="error"><h1>Page not found.</h1><p>This note may have moved or is still being written.</p><a href="#home">← Return to the library</a></section>'; }
}

function bindCreate() {
  const dialog = document.querySelector('#create-dialog');
  document.querySelectorAll('[data-open-create]').forEach(button => button.onclick = e => { e.preventDefault(); dialog.showModal(); setTimeout(()=>document.querySelector('#page-title').focus(),50); });
}

document.querySelector('#create-form').addEventListener('submit', e => {
  e.preventDefault();
  const title = document.querySelector('#page-title').value.trim();
  if (!title) return;
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'new-page';
  const value = `---\ntitle: ${title}\n---\n\nStart writing here.\n`;
  window.location.href = `https://github.com/${REPO}/new/main/pages?filename=${encodeURIComponent(slug+'.md')}&value=${encodeURIComponent(value)}`;
});

const main = document.querySelector('main'); main.dataset.home = main.innerHTML;
function route(){ const match=location.hash.match(/^#page=(.+)$/); match ? renderPage(decodeURIComponent(match[1])) : renderHome(); }
window.addEventListener('hashchange',route); route();
