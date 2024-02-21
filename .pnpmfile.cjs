/**
 * @param {Record.<String, String>} dependencies
 */
function modifyDependencies(dependencies) {
  for (const name in dependencies) {
    if (!name.startsWith('@girs/')) continue
    const [firstChar, ...rest] = dependencies[name]
    if (firstChar !== '^' && firstChar !== '~') continue
    dependencies[name] = '=' + rest.join('')
  }
}

/**
 * @param {Object} pkg
 * @param {String} pkg.name
 * @param {Record.<String, String>} pkg.dependencies
 * @param {Record.<String, String>} pkg.devDependencies
 * @param {Record.<String, String>} pkg.peerDependencies
 */
function readPackage(pkg) {
  if (pkg.name.startsWith('@girs/')) {
    modifyDependencies(pkg.dependencies)
    modifyDependencies(pkg.devDependencies)
    modifyDependencies(pkg.peerDependencies)
  }
  return pkg
}

module.exports = {
  hooks: { readPackage },
}
