/**
 * dsh-ventus-research — AskUserQuestion 工作台桥接。
 *
 * 注入 conversation.composer chain slot，select 匹配 AI 提问（kind==='question'），
 * 把 QuestionPublish 广播到模块级 store，供科研工作台订阅显示。
 * 用户在工作台选择后，通过 QuestionWait.respond() 回填 host→模型。
 *
 * 内联类型（duck typing）避免跨插件 import 类型依赖（tsdown external 跳过）。
 */
import { useEffect, useSyncExternalStore } from 'react'

// ---- 内联类型（与官方 QuestionWait / ComposerChainProps 同构）----

interface QuestionItem {
  id: string
  question: string
  header?: string
  options?: Array<{ label: string; description?: string }>
  multiSelect?: boolean
  detail?: string
  intent?: { kind: string; approve?: string }
}

interface QuestionAnswer {
  answers: Array<{ id: string; selected?: string[]; custom?: string }>
}

interface QuestionWait {
  kind: 'question'
  key: string
  sessionId: string
  payload: { questions: QuestionItem[] }
  respond(msg: { ok: boolean; value?: { sessionId: string; answer: QuestionAnswer }; error?: { code: string; message: string; details: any } }): Promise<{ accepted: boolean; reason?: string }>
}

interface ComposerInteraction {
  kind: string
  key: string
  sessionId: string
  payload: { questions: QuestionItem[] }
  respond(msg: any): Promise<{ accepted: boolean; reason?: string }>
}

interface ComposerChainProps {
  interactions: readonly ComposerInteraction[]
  session: any
}

// ---- 模块级 store（工作台订阅）----

export interface PendingQuestion {
  wait: QuestionWait
  question: QuestionItem
  index: number
}

let current: PendingQuestion | null = null
let currentIndex = 0
const listeners = new Set<() => void>()

function notify(): void {
  for (const fn of [...listeners]) fn()
}

export function publishQuestion(wait: QuestionWait): void {
  current = { wait, question: wait.payload.questions[0]!, index: 0 }
  currentIndex = 0
  notify()
}

export function clearQuestion(): void {
  current = null
  currentIndex = 0
  notify()
}

export function getQuestion(): PendingQuestion | null { return current }

export function setQuestionIndex(index: number): void {
  if (current === null) return
  const q = current.wait.payload.questions[index]
  if (q === undefined) return
  current = { wait: current.wait, question: q, index }
  currentIndex = index
  notify()
}

function getCurrentQuestion(): PendingQuestion | null {
  return current
}

function subscribeQuestion(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function useQuestion(): PendingQuestion | null {
  return useSyncExternalStore(subscribeQuestion, getCurrentQuestion)
}

// ---- conversation.composer select（匹配 AI 提问）----

export function selectQuestion({ interactions }: ComposerChainProps): ComposerInteraction | null {
  return interactions.find((i): i is ComposerInteraction => i.kind === 'question') ?? null
}

// ---- Bridge 组件：把匹配的提问广播到工作台，自身不渲染 ----

export function QuestionBridge({ matched }: { matched: ComposerInteraction }): null {
  useEffect(() => {
    publishQuestion(matched as unknown as QuestionWait)
    return () => { clearQuestion() }
  }, [matched])
  return null
}