// Tinker Lab brand configuration. Everything brand-specific lives here so it can be
// swapped in one place when the final brand guidelines arrive.
export const BRAND = {
  name: 'Tinker Lab',
  short: 'Tinker Lab',
  tagline: 'The virtual maker space',
  promise: 'Learn how things work. Then build them.',
  description:
    'Tinker Lab is a virtual maker space for electronics, coding, robotics, IoT and AI: learn from first principles, build in interactive 3D, write and debug real code, then take it to real hardware.',
  // Legal entity and contact details: fill these in before launch (shown on legal pages).
  company: '[Company legal name]',
  companyAddress: '[Registered address]',
  contactEmail: 'hello@[your-domain]',
  privacyEmail: 'privacy@[your-domain]',
  domain: '[your-domain]',
  legalEffectiveDate: '3 November 2026',
  governingLaw: '[Country / State]',
};

/** True while any legal placeholder above has not been filled in. */
export const BRAND_PLACEHOLDERS = Object.values(BRAND).some((v) => typeof v === 'string' && v.includes('['));
