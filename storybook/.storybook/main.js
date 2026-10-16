/** The Profolio components Storybook (storybook/gen.mjs writes the stories).
 * SB_BASE: where the versions are published (the Pages URL + /storybook), so the sidebar's
 * "Releases" menu opens an earlier skill release's components. Unset in local builds. */
import { readFileSync } from 'node:fs';

const versions = JSON.parse(readFileSync(new URL('../versions.json', import.meta.url), 'utf8'));
const base = (process.env.SB_BASE || '').replace(/\/$/, '');
const current = process.env.SB_PATH || '';
const others = versions.filter((v) => v.path !== current);

export default {
  framework: { name: '@storybook/html-vite', options: {} },
  stories: ['../generated/**/*.mdx', '../generated/**/*.stories.js'],
  addons: ['@storybook/addon-docs'],
  staticDirs: ['../public'],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  refs: base && others.length ? {
    releases: {
      title: 'Releases',
      url: `${base}/${others[0].path}`,
      versions: Object.fromEntries(others.map((v) => [v.label, `${base}/${v.path}`])),
      expanded: false,
    },
  } : {},
  /* publicDir: false — staticDirs copies public/ already; Vite copying it too races (EEXIST) */
  viteFinal: async (config) => ({ ...config, base: './', publicDir: false }),
};
