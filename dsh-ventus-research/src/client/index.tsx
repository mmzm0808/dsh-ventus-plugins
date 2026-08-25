/**
 * dsh-ventus-research — 科研工作台 client 入口。
 *
 * 在对话区「对话 / 轨迹 / 上下文」标签栏右侧注册「科研」标签（conversation.view，
 * order 30）。工作台从 host 的 GET /research-bench/state 读取当前课题状态并渲染
 * claims 状态机、验证/证据/裁决摘要。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { ResearchWorkbench } from './workbench.tsx'

export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.view', () => ctx.slots.register(
    { name: 'conversation.view', id: 'research', order: 30, locale: 'research', label: () => '科研' },
    props => <ResearchWorkbench {...props} />,
  ))
}
