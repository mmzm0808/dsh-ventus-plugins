/**
 * choice-popup — 链接/产物点击后的双按钮选择浮窗（纯 DOM，单例）。
 *
 * 在点击坐标处弹一张小卡片：两个动作按钮 + 遮罩（点击外部或 Esc 关闭）。
 * 浮窗固定定位在视口内，靠近右/下边缘时自动翻转方向，避免溢出。
 * 与 link-intercept / produced-intercept 配合：拦截点击后由用户
 * 显式选择动作，不再静默吞掉点击（「点不动」的根因）。
 */
export interface ChoiceAction {
    label: string;
    onPick: () => void;
}
/** 关闭当前浮窗（若有）。 */
export declare function closeChoicePopup(): void;
/** 在 (x, y) 处弹出双按钮选择浮窗。 */
export declare function showChoicePopup(x: number, y: number, actions: ChoiceAction[]): void;
