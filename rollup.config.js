// Ref https://medium.com/javascript-in-plain-english/bundling-monorepos-the-right-way-34116aa50433
import path from "path";

import { getPackages } from "@lerna/project";
import filterPackages from "@lerna/filter-packages";
import batchPackages from "@lerna/batch-packages";
import minimist from "minimist";

/**
 * @param {string}[scope] - packages to only build (if you don't
 *    want to build everything)
 * @param {string}[ignore] - packages to not build
 *
 * @returns {string[]} - sorted list of Package objects that
 *    represent packages to be built.
 */
async function getSortedPackages(scope, ignore) {
  const packages = await getPackages(__dirname);
  const filtered = filterPackages(packages, scope, ignore, false);

  return batchPackages(filtered).reduce((arr, batch) => arr.concat(batch), []);
}

async function main() {
  const config = [];
  // Support --scope and --ignore globs if passed in via commandline
  const { scope, ignore } = minimist(process.argv.slice(2));
  const packages = await getSortedPackages(scope, ignore);
  packages.forEach(pkg => {
    /* Absolute path to package directory */
    const basePath = path.relative(__dirname, pkg.location);
    /* Absolute path to input file */
    const input = path.join(basePath, 'src/index.js');
    /* "main" field from package.json file. */
    const { main } = pkg.toJSON();
    /* Push build config for this package. */
    config.push({
      input,
      output: [{
        file: path.join(basePath, main),
        format: 'cjs',
        sourcemap: true
      }, /* Add any other configs (for esm or iife format?) */],
    });
  });
  return config;
}

export default main();
