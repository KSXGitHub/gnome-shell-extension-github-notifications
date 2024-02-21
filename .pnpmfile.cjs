/**
 * @param {Record.<String, String>} dependencies
 */
function modifyDependencies(dependencies) {
  for (const name in dependencies) {
    if (!name.startsWith('@girs/')) continue
    const oldValue = dependencies[name]
    const firstChar = oldValue[0]
    if (!firstChar) continue
    const rest = oldValue.slice(1)
    if (firstChar !== '^' && firstChar !== '~') continue
    dependencies[name] = '=' + rest
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
