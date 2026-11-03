// Dev server for screenshot QA: no hot reload, no file watching, so edits made
// by other people while you test don't reload your page. Restart it after edits.
// npx vite --config scripts/vite.qa.config.js --port <port>
import base from '../vite.config.js';

export default { ...base, server: { hmr: false, watch: null } };
