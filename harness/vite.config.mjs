/**
 * The product's own Vite config, with the harness's own dependency cache.
 *
 * harness/serve.mjs copies this into the product as harness.vite.config.mjs
 * (untracked, listed in .git/info/exclude) and starts `yarn start --config`
 * with it. Nothing else differs from the product's config: same plugins, same
 * aliases, same antd theme. The cache is separate because a normal
 * `yarn start` may be running beside the harness with a different .env, and
 * two servers sharing node_modules/.vite keep invalidating each other.
 */
import product from './vite.config.js';

export default async (env) => ({ ...(await product(env)), cacheDir: 'node_modules/.vite-harness' });
