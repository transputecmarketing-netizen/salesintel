// Shared header and footer for every marketing page.
// Usage in a page: <header id="site-head"></header> … <footer id="site-foot"></footer>
// then: import { mountShell } from '/src/site/shell.js'; mountShell({ current: '/about/' });
import './site.css';
import { markSVG } from '../brand/logo.js';
import { lucide, hydrateIcons } from '../brand/lucide.js';
import { BRAND } from '../brand/brand.js';

export const NAV = [
  { href: '/learn/', label: 'Learn' },
  { href: '/studio/', label: 'Studio' },
  { href: '/guide/', label: 'Build guides' },
  { href: '/curriculum/', label: 'Curriculum' },
  { href: '/about/', label: 'About' },
];

export const FOOTER = [
  { title: 'Learn', links: [['Start learning', '/learn/'], ['Curriculum', '/curriculum/'], ['Build guides', '/guide/'], ['Tinker Studio', '/studio/'], ['Boards', '/boards/']] },
  { title: 'Tinker Lab', links: [['About us', '/about/'], ['Our mission', '/mission/'], ['Why we started', '/story/'], ['For educators', '/educators/'], ['Contact', '/contact/']] },
  { title: 'Trust', links: [['Transparency', '/transparency/'], ['Privacy policy', '/legal/privacy/'], ['Cookie policy', '/legal/cookies/'], ['Terms of use', '/legal/terms/']] },
];

const here = (href, current) => (current && (current === href || (href !== '/' && current.startsWith(href))) ? ' aria-current="page"' : '');

export function headerHTML({ current = location.pathname, cta = true } = {}) {
  return `<div class="wrap">
    <a class="site-brand" href="/" aria-label="${BRAND.name} home">${markSVG({ size: 30 })}<span>${BRAND.name}</span></a>
    <nav class="site-nav" aria-label="Main">${NAV.map((n) => `<a href="${n.href}"${here(n.href, current)}>${n.label}</a>`).join('')}</nav>
    ${cta ? `<div class="site-cta"><a class="btn btn-primary btn-sm" href="/learn/">Start building</a></div>` : ''}
    <button class="icon-btn site-menu" aria-label="Menu" aria-expanded="false">${lucide('menu', { size: 20 })}</button>
  </div>`;
}

export function footerHTML() {
  const year = new Date().getFullYear();
  return `<div class="wrap">
    <div class="foot-top">
      <div class="foot-brand"><a class="site-brand" href="/" aria-label="${BRAND.name} home">${markSVG({ size: 30 })}<span>${BRAND.name}</span></a><p>${BRAND.promise}</p></div>
      ${FOOTER.map((c) => `<nav class="foot-col" aria-label="${c.title}"><h4>${c.title}</h4>${c.links.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>`).join('')}
    </div>
    <div class="foot-bottom">
      <p>© ${year} ${BRAND.company.includes('[') ? BRAND.name : BRAND.company}. All rights reserved.</p>
      <p>Arduino, ESP32, ESP8266, Raspberry Pi, NVIDIA and Jetson are trademarks of their owners. ${BRAND.name} is independent and not affiliated with them. Board models are illustrations.</p>
    </div>
  </div>`;
}

/** Fill #site-head / #site-foot, wire the mobile menu, sticky border and reveal-on-scroll. */
export function mountShell(opts = {}) {
  if (new URLSearchParams(location.search).has('static')) document.documentElement.classList.add('no-reveal');
  const head = document.getElementById('site-head');
  const foot = document.getElementById('site-foot');
  if (head) {
    head.classList.add('site-head');
    head.innerHTML = headerHTML(opts);
    const btn = head.querySelector('.site-menu');
    btn.addEventListener('click', () => {
      const open = head.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      btn.innerHTML = lucide(open ? 'x' : 'menu', { size: 20 });
    });
    const onScroll = () => head.classList.toggle('is-scrolled', scrollY > 4);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (foot) {
    foot.classList.add('site-foot');
    foot.innerHTML = footerHTML();
  }
  hydrateIcons();
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  return { reveal: (el) => { el.classList.add('reveal'); io.observe(el); } };
}
