// Project storage: autosave to localStorage (several projects), JSON export /
// import, share links (lz-string in the URL hash) and .ino download.
import LZString from 'lz-string';
import { normalizeProject } from './model.js';

const NS = 'tinkerlab:studio:';
const get = (k, d) => { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch { return false; } };
const del = (k) => { try { localStorage.removeItem(NS + k); } catch { /* */ } };

export const storage = {
  list() { return get('index', []).sort((a, b) => b.updated - a.updated); },
  load(id) {
    const p = get(`p:${id}`, null);
    try { return p ? normalizeProject(p) : null; } catch { return null; }
  },
  save(p) {
    p.updated = Date.now();
    const ok = set(`p:${p.id}`, p);
    const idx = get('index', []).filter((x) => x.id !== p.id);
    idx.push({ id: p.id, name: p.name, board: p.board, updated: p.updated, parts: p.parts.length });
    set('index', idx);
    set('current', p.id);
    return ok;
  },
  remove(id) {
    del(`p:${id}`);
    set('index', get('index', []).filter((x) => x.id !== id));
  },
  current() { return get('current', null); },
  flag(name, v) { if (v === undefined) return get(`flag:${name}`, false); set(`flag:${name}`, v); return v; },
};

export function shareUrl(p) {
  const { id, updated, ...rest } = p;
  const data = LZString.compressToEncodedURIComponent(JSON.stringify(rest));
  return `${location.origin}${location.pathname}#p=${data}`;
}

export function fromShare(hash) {
  const m = /[#&]p=([^&]+)/.exec(hash);
  if (!m) return null;
  const json = LZString.decompressFromEncodedURIComponent(m[1]);
  if (!json) throw new Error('This share link is damaged or incomplete.');
  return normalizeProject(JSON.parse(json));
}

export function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export const fileSafe = (s) => (String(s).trim().replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'sketch').slice(0, 60);
