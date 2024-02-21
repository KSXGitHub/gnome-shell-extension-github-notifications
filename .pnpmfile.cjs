/**
 * @param {Record.<String, String>} [dependencies]
 */
function pinGirs(dependencies) {
  if (!dependencies) return
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
 * @param {Record.<String, String>} [pkg.dependencies]
 * @param {Record.<String, String>} [pkg.devDependencies]
 * @param {Record.<String, String>} [pkg.peerDependencies]
 */
function readPackage(pkg) {
  if (pkg.name.startsWith('@girs/')) {
    pinGirs(pkg.dependencies)
    pinGirs(pkg.devDependencies)
    pinGirs(pkg.peerDependencies)
  }
  return pkg
}

module.exports = {
  hooks: { readPackage },
}
