/**
 * produced-intercept — 回合结束产物 chips 的点击拦截。
 *
 * 官方 ui-deliverables 把一轮的产出文件渲染为 `[data-produced-files-row]`
 * 内的 chips（title 为完整路径，点击走官方 openFile，常表现为「点不动」）。
 * 本模块在 document capture 阶段拦截点击：先删掉默认行为，弹双按钮
 * 「侧边栏编辑器打开 / 系统打开」，由用户显式选择。
 *
 * 产物是本地文件（文本类），第一动作永远是侧边栏编辑器；「系统打开」
 * 走 webui 的 file-explorer open-in-explorer 路由（整合包内可用）。
 */
/** 提取路径的 basename（同时兼容 / 与 \ 分隔）。 */
export declare function basenameOf(path: string): string;
/**
 * Register the document-level click capture for produced-file chips.
 * Returns the disposer (HMR-safe).
 */
export declare function registerProducedInterception(opts: {
    /** Open the path in the sidebar editor tab. */
    openInEditor: (path: string) => void;
}): () => void;
