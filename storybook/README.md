# The components Storybook

Every Profolio KSA component and variant from the design skill, the kit's patterns, and the
components locked designs propose. Published on GitHub Pages at `/storybook/` (the current main)
and `/storybook/<version>/` (each release in `versions.json`), with a **Releases** menu in the
sidebar to open an earlier release.

    cd storybook && npm ci
    npm run dev        # http://localhost:6006
    npm run build      # dist/

`gen.mjs` writes the stories from the skill (`--skill <dir>`, default `../skill`):
- **Components**: `skill/registry.json` → each component page's variants, as framed previews;
- **Kit**: `kit/*.html`, samples of the kit's patterns;
- **Proposed**: `proposed/<feature>/<component>.json + .html`, sent by a locked design's retro
  (`skill/qa/retro.mjs`); each proposal of one component is a version of it.

**A new skill release:** add it at the top of `versions.json` (`tag`, `path`, `label`). The Pages
job builds every listed version from its tag's `skill/` folder.

The add-on `storybook-addon-versions` targets Storybook 3 (React 15, 2017) and does not install on
Storybook 10; the version menu is Storybook's own composition (`refs` with `versions`).
