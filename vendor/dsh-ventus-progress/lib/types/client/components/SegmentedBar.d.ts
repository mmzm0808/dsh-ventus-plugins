/** 分段进度条：每段宽度 = weight%，状态用颜色区分。 */
import type { ProgressStage } from '../../shared/progress-types.js';
export declare function SegmentedBar({ stages }: {
    stages: ProgressStage[];
}): React.JSX.Element;
