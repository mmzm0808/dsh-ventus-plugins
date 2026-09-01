// ═══════════════════════════════════════════════════════════════════════════════
// ⚠ 警告：以下特权 fetch 捕获机制是 DSH 启动链路的关键基础设施。
//    DSH boot 过程中全局 fetch 会被替换成 scopedFetch（内部引用未初始化的
//    fetchBase，导致所有调用报 fetchBase is not a function）。此文件捕获的
//    pristine fetch 是 proxy.js 免疫修复的唯一起源，删除或修改将导致所有
//    API 请求（截图、usage、llm 等）全部失败。
//    修改此文件时必须同步验证：
//      1. proxy.js 的 installFetchHook 仍能读到 Symbol.for('dsh.pristineFetch')
//      2. 全局 fetch 在 boot 后被污染为 scopedFetch 时能被复原
//    任何重构/webui 重新构建后，必须确认此文件仍在 --require preload 中。
// 构建产物来源：dsh-webui/src/capture-fetch.cjs（源码），手动修改后不会被
// 构建覆盖，但若 dsh-webui 重新构建并 cp 到 vendor 会覆盖，需重新应用修改。
// ═══════════════════════════════════════════════════════════════════════════════
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
