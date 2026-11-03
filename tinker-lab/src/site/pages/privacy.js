// privacy policy: static content in /legal/privacy/index.html; common.js fills BRAND values and builds the contents list.
import { initPage, buildToc } from './common.js';

initPage({ current: '/legal/privacy/' });
buildToc();
