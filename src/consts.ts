// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Asif Ahmed';
export const SITE_DESCRIPTION =
	"I help people and solve problems. Lately that's building software with AI at a venture firm.";
export const CAL_URL = 'https://cal.com/sifxtreme/meet-with-asif?overlayCalendar=true';

// Which site design renders. Each design lives in src/designs/<name>/ and owns its
// homepage + post layout; everything else (components, content) is shared.
// To switch designs, change the default below and rebuild. A single build can also
// pick one without a code change: PUBLIC_DESIGN=transit npm run build (used for previews).
export const DESIGNS = ['classic', 'receipt', 'transit', 'ledger'] as const;
export type Design = (typeof DESIGNS)[number];
const requested = import.meta.env.PUBLIC_DESIGN as string | undefined;
if (requested && !DESIGNS.includes(requested as Design)) {
	throw new Error(`PUBLIC_DESIGN="${requested}" is not one of: ${DESIGNS.join(', ')}`);
}
export const DESIGN: Design = (requested as Design) || 'ledger'; // Asif 2026-11-20 decision 491: ledger is live

// The family owl mark (src/assets/owl-navy.png, owl-cream.png for dark). Asif approved the
// cropped owl for the public site 2026-11-20 (not the full seal with its lettering).
// Only the ledger design shows it: in the header next to his photo, and as the sign-off
// under each post's receipt. Set false and the slot renders nothing.
export const OWL_ENABLED = true;
