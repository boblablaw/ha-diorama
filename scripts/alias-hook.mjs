// Node forbids any import specifier that begins with "#/" (it reserves that
// shape), so the "#/*" -> "./src/*" subpath map in package.json only ever
// resolves through Vite, never through plain `node`. The generator scripts
// (showroom.ts, demoflat.ts) import the catalog through that alias, so they
// need this hook to run under node. It rewrites a leading "#/" to an absolute
// URL under src/ before Node's resolver sees it. Loaded with
// `node --import ./scripts/alias-hook.mjs <script>`.
import { registerHooks } from 'node:module'

const SRC = new URL('../src/', import.meta.url)

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('#/')) {
      return next(new URL(specifier.slice(2), SRC).href, context)
    }
    return next(specifier, context)
  },
})
