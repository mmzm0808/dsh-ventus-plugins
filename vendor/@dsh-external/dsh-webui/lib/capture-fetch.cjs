// Capture the pristine global fetch at the earliest possible moment
// (Node --require preload, before any plugin runs). Later pollution
// (Electron scopedFetch under ELECTRON_RUN_AS_NODE) cannot touch this
// captured reference. dsh-proxy reads it via Symbol.for('dsh.pristineFetch').
if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
  const pristine = globalThis.fetch
  Object.defineProperty(globalThis, Symbol.for('dsh.pristineFetch'), {
    value: pristine,
    configurable: true,
    writable: false,
  })
}
