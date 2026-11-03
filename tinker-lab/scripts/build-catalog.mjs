// Writes src/lessons/catalog.json: a light index of every track and lesson (titles, boards,
// levels, counts), so the website pages don't have to download all lesson code.
// Runs automatically before `npm run dev` and `npm run build`.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TRACKS } from '../src/lessons/index.js';
import { BOARD_INFO } from '../src/scene/boards/index.js';

const plain = (html = '') => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const catalog = {
  boards: BOARD_INFO,
  tracks: TRACKS.map((t) => ({
    id: t.id, title: t.title, level: t.level, board: t.board ?? null, lang: t.lang ?? null,
    icon: t.icon, group: t.group ?? null, blurb: t.blurb,
    lessons: t.lessons.map((l) => ({
      id: l.id, title: l.title, icon: l.icon ?? null, board: l.board ?? null, lang: l.lang ?? null,
      level: l.level ?? t.level, explainer: !!l.explainer,
      overview: { heading: l.overview?.heading ?? l.title, text: plain(l.overview?.text).slice(0, 320) },
      quizCount: l.quiz?.length ?? 0,
      challengeCount: l.challenges?.length ?? 0,
    })),
  })),
};

const out = fileURLToPath(new URL('../src/lessons/catalog.json', import.meta.url));
writeFileSync(out, JSON.stringify(catalog));
const n = catalog.tracks.reduce((a, t) => a + t.lessons.length, 0);
console.log(`catalog: ${catalog.tracks.length} tracks, ${n} lessons → src/lessons/catalog.json`);
