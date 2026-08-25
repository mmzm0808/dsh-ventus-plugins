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
import { QuestionBridge, selectQuestion } from './question-bridge.tsx'

export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.view', () => ctx.slots.register(
    { name: 'conversation.view', id: 'research', order: 30, locale: 'research', label: () => '科研' },
    props => <ResearchWorkbench {...props} />,
  ))

  // AskUserQuestion 桥接：匹配 AI 提问（conversation.composer chain），
  // 广播到科研工作台显示；工作台选择后走 wait.respond 回填模型。
  ctx.slots.inject('conversation.composer', () => ctx.slots.register(
    { name: 'conversation.composer', select: selectQuestion },
    props => <QuestionBridge matched={props.matched} />,
  ))
}
