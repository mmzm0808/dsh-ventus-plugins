/**
 * cdp.mjs — 极简 CDP over WebSocket 客户端（调试专用，非插件产物）
 *
 * 用法：
 *   node scripts/cdp.mjs eval  <targetIdPrefix|'list'> [expression]
 *   node scripts/cdp.mjs list
 *
 * 通过 http://127.0.0.1:9333/json/list 发现页面 target，
 * 用原生 WebSocket（Node ≥22 内置）发送 Runtime.evaluate。
 */
const DEBUG_PORT = process.env.CDP_PORT || '9333'

async function listTargets() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
  return res.json()
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let id = 0
    const pending = new Map()
    ws.onopen = () => resolve({
      send(method, params) {
        return new Promise((res2, rej2) => {
          const mid = ++id
          pending.set(mid, { res2, rej2 })
          ws.send(JSON.stringify({ id: mid, method, params }))
        })
      },
      close() { ws.close() },
    })
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && pending.has(msg.id)) {
        const { res2, rej2 } = pending.get(msg.id)
        pending.delete(msg.id)
        if (msg.error) rej2(new Error(JSON.stringify(msg.error)))
        else res2(msg.result)
      }
    }
    ws.onerror = reject
  })
}

async function connectAndListen(wsUrl, seconds) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let id = 0
    const pending = new Map()
    const events = []
    ws.onopen = () => {
      const send = (method, params) => new Promise((res2, rej2) => {
        const mid = ++id
        pending.set(mid, { res2, rej2 })
        ws.send(JSON.stringify({ id: mid, method, params }))
      })
      const boot = async () => {
        await send('Runtime.enable')
        await send('Log.enable')
        await send('Page.enable')
        await send('Page.reload', { ignoreCache: true })
        setTimeout(async () => {
          const consoleMsgs = events.filter(e => e.type === 'console')
          const exceptions = events.filter(e => e.type === 'exception')
          const logs = events.filter(e => e.type === 'log')
          console.log(JSON.stringify({
            consoleErrors: consoleMsgs.filter(m => ['error', 'warning'].includes(m.level)),
            exceptions: exceptions.slice(0, 10).map(e => e.detail),
            logErrors: logs.filter(l => ['error', 'warning'].includes(l.level)).slice(0, 20),
          }, null, 2))
          ws.close()
          resolve()
        }, seconds * 1000)
      }
      boot().catch(reject)
    }
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && pending.has(msg.id)) {
        const { res2, rej2 } = pending.get(msg.id)
        pending.delete(msg.id)
        if (msg.error) rej2(new Error(JSON.stringify(msg.error)))
        else res2(msg.result)
        return
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        events.push({ type: 'console', level: msg.params.type, text: msg.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 400) })
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails
        events.push({ type: 'exception', detail: (d.exception?.description || d.text || '').slice(0, 600) })
      } else if (msg.method === 'Log.entryAdded') {
        events.push({ type: 'log', level: msg.params.entry.level, text: msg.params.entry.text.slice(0, 400) })
      }
    }
    ws.onerror = reject
  })
}

const [, , cmd, arg, ...rest] = process.argv

if (cmd === 'list') {
  const targets = await listTargets()
  for (const t of targets.filter(t => t.type === 'page')) {
    console.log(t.id.slice(0, 8), JSON.stringify(t.title).slice(0, 60), t.url.slice(0, 90))
  }
  process.exit(0)
}

if (cmd === 'eval') {
  const targets = await listTargets()
  const page = targets.find(t => t.type === 'page' && (arg === undefined || t.id.startsWith(arg) || t.url.includes(arg)))
  if (!page) { console.error('no page matched'); process.exit(1) }
  const cdp = await connect(page.webSocketDebuggerUrl)
  const expr = rest.join(' ') || 'document.title'
  // awaitPromise + returnByValue：支持 async IIFE 取回结果
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (r.exceptionDetails) {
    console.error('EXCEPTION:', JSON.stringify(r.exceptionDetails, null, 2))
  } else {
    const v = r.result.value
    console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2))
  }
  cdp.close()
  process.exit(0)
}

if (cmd === 'reload') {
  const targets = await listTargets()
  const page = targets.find(t => t.type === 'page' && (arg === undefined || t.id.startsWith(arg) || t.url.includes(arg)))
  if (!page) { console.error('no page matched'); process.exit(1) }
  const seconds = Number(rest[0] || '8')
  await connectAndListen(page.webSocketDebuggerUrl, seconds)
  process.exit(0)
}

console.error('usage: node scripts/cdp.mjs list | eval <idPrefix|urlPart> <expr> | reload <idPrefix|urlPart> [seconds]')
process.exit(1)
