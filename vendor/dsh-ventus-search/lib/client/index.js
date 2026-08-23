/**
 * dsh-ventus-search — browser half. Ventus-series settings card: master switch
 * (PATCH /api/ventus-search/state), per-engine enable toggles + health status
 * with polling, and a live test search (POST /api/ventus-search/test). All
 * fetches/timers/listeners are cleaned up with the client fiber.
 * @module dsh-ventus-search/client
 */
import { createElement, useEffect, useRef, useState } from 'react';
/** Required service: slots lets the plugin claim the Ventus settings seat. */
export const inject = ['slots'];
/** Engine display names in card order. */
const ENGINE_ROWS = [
    { id: 'bing', label: 'Bing' },
    { id: 'so360', label: '360 搜索' },
    { id: 'bilibili', label: 'Bilibili' },
];
const STATE_URL = '/api/ventus-search/state';
const TEST_URL = '/api/ventus-search/test';
const POLL_MS = 10_000;
const DEFAULT_QUERY = 'DeepSeek Harness 最新动态';
const cardStyle = {
    listStyle: 'none',
    padding: '16px 18px',
    border: '1px solid var(--dsw-alias-line-normal)',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 5%, transparent), transparent 45%), var(--dsw-alias-bg-module-platform)',
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.03)',
    color: 'var(--dsw-alias-label-primary)',
    fontFamily: 'inherit',
};
const headStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    borderRadius: '8px',
    padding: '2px 0',
};
const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--dsw-alias-label-primary)',
};
const accentStyle = {
    width: '3px',
    height: '14px',
    borderRadius: '2px',
    background: 'var(--dsw-alias-state-business-primary)',
    flex: 'none',
};
const chevronStyle = {
    flex: 'none',
    marginLeft: '8px',
    color: 'var(--dsw-alias-label-secondary)',
    fontSize: '12px',
    transition: 'transform 150ms ease',
};
const bodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    fontSize: '13px',
};
const mutedStyle = {
    color: 'var(--dsw-alias-label-secondary)',
};
const groupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 14px',
    border: '1px solid var(--dsw-alias-line-normal)',
    borderRadius: '10px',
    background: 'color-mix(in srgb, var(--dsw-alias-bg-module-hover) 30%, transparent)',
};
const groupHeadStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    color: 'var(--dsw-alias-label-secondary)',
};
const masterRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
};
const labelStackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
};
const engineRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    transition: 'background 120ms ease',
};
const engineRowHoverStyle = {
    background: 'color-mix(in srgb, var(--dsw-alias-bg-module-hover) 55%, transparent)',
};
const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    cursor: 'pointer',
};
const engineInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    minWidth: 0,
};
const engineStatusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
};
const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flex: 'none',
    boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 18%, transparent)',
};
const engineDetailStyle = {
    fontSize: '11px',
    color: 'var(--dsw-alias-label-secondary)',
    maxWidth: '260px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};
const smallButtonStyle = {
    appearance: 'none',
    WebkitAppearance: 'none',
    height: '26px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid var(--dsw-alias-line-normal)',
    background: 'transparent',
    color: 'var(--dsw-alias-label-secondary)',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'border-color 120ms ease, color 120ms ease',
};
const testRowStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};
const testInputStyle = {
    flex: 1,
    minWidth: 0,
    height: '32px',
    padding: '0 10px',
    borderRadius: '8px',
    border: '1px solid var(--dsw-alias-line-normal)',
    background: 'var(--dsw-alias-bg-module-platform)',
    color: 'var(--dsw-alias-label-primary)',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
};
const primaryButtonStyle = {
    appearance: 'none',
    WebkitAppearance: 'none',
    flex: 'none',
    height: '32px',
    padding: '0 14px',
    borderRadius: '8px',
    border: '1px solid var(--dsw-alias-state-business-primary)',
    background: 'var(--dsw-alias-state-business-primary)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'filter 120ms ease',
};
const testMetaStyle = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--dsw-alias-label-secondary)',
};
const badgeStyle = {
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#059669',
    border: '1px solid color-mix(in srgb, #059669 45%, transparent)',
    background: 'color-mix(in srgb, #059669 12%, transparent)',
};
const sourceListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
};
const sourceItemStyle = {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--dsw-alias-line-normal)',
    background: 'color-mix(in srgb, var(--dsw-alias-bg-module-hover) 22%, transparent)',
};
const sourceTitleStyle = {
    display: 'block',
    color: 'var(--dsw-alias-label-primary)',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};
const sourceSnippetStyle = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--dsw-alias-label-secondary)',
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};
const sourceUrlStyle = {
    marginTop: '4px',
    fontSize: '11px',
    color: 'var(--dsw-alias-label-secondary)',
    opacity: 0.8,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};
const errorStyle = {
    color: '#f87171',
    fontSize: '12px',
};
const disabledStyle = { opacity: 0.45, pointerEvents: 'none' };
/** Health meta: label, dot color, title. */
function healthMeta(health) {
    if (health === 'ok')
        return { label: '正常', color: '#34d399' };
    if (health === 'fail')
        return { label: '失败', color: '#f87171' };
    return { label: '未测', color: '#8b95a7' };
}
/** Compact human time for an ISO timestamp, or '—' when missing. */
function formatTime(iso) {
    if (!iso)
        return '—';
    try {
        return new Date(iso).toLocaleString();
    }
    catch {
        return '—';
    }
}
/** Truncate a long error line for display. */
function shortError(message) {
    if (!message)
        return '—';
    return message.length > 60 ? message.slice(0, 60) + '…' : message;
}
/** Fresh per-engine fallback used before the first state load. */
function fallbackEngine() {
    return { enabled: true, health: 'untested', lastOkAt: null, lastError: null };
}
/** Settings card for Ventus 搜索. */
export function VentusSearchSettingsCard() {
    const [collapsed, setCollapsed] = useState(true);
    const [state, setState] = useState(null);
    const [saving, setSaving] = useState(false);
    const [engineBusy, setEngineBusy] = useState(null);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [hovered, setHovered] = useState(null);
    // Abort any user-triggered fetch when the fiber disposes.
    const actionController = useRef(null);
    useEffect(() => {
        const controller = new AbortController();
        let timer;
        const load = async () => {
            try {
                const response = await fetch(STATE_URL, {
                    signal: controller.signal,
                    headers: { 'cache-control': 'no-cache' },
                });
                if (!response.ok)
                    throw new Error('HTTP ' + response.status);
                const data = await response.json();
                setState(data);
                setError(null);
            }
            catch (err) {
                if (!controller.signal.aborted)
                    setError(err instanceof Error ? err.message : String(err));
            }
        };
        void load();
        timer = setInterval(() => { void load(); }, POLL_MS);
        return () => {
            controller.abort();
            actionController.current?.abort();
            if (timer !== undefined)
                clearInterval(timer);
        };
    }, []);
    /** PATCH state with the given patch and apply the returned state. */
    const patch = async (body) => {
        actionController.current?.abort();
        const controller = new AbortController();
        actionController.current = controller;
        const response = await fetch(STATE_URL, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok)
            throw new Error('HTTP ' + response.status);
        const data = await response.json();
        setState(data);
        setError(null);
    };
    const toggleMaster = async (enabled) => {
        setSaving(true);
        try {
            await patch({ enabled });
        }
        catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
        finally {
            setSaving(false);
        }
    };
    const toggleEngine = async (id, enabled) => {
        setEngineBusy(id);
        try {
            await patch({ engines: { [id]: enabled } });
        }
        catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
        finally {
            setEngineBusy(null);
        }
    };
    const refresh = async () => {
        actionController.current?.abort();
        const controller = new AbortController();
        actionController.current = controller;
        try {
            const response = await fetch(STATE_URL, {
                headers: { 'cache-control': 'no-cache' },
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error('HTTP ' + response.status);
            const data = await response.json();
            setState(data);
            setError(null);
        }
        catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
    };
    const runTest = async () => {
        if (query.trim().length === 0) {
            setError('请输入测试查询词');
            return;
        }
        setTesting(true);
        setTestResult(null);
        actionController.current?.abort();
        const controller = new AbortController();
        actionController.current = controller;
        try {
            const response = await fetch(TEST_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ query }),
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error('HTTP ' + response.status);
            const data = await response.json();
            setTestResult(data);
            setError(null);
        }
        catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
        finally {
            setTesting(false);
        }
    };
    const enabled = state?.enabled ?? true;
    const engines = state?.engines ?? {
        bing: fallbackEngine(),
        so360: fallbackEngine(),
        bilibili: fallbackEngine(),
    };
    const head = createElement('div', {
        style: headStyle,
        role: 'button',
        tabIndex: 0,
        'aria-expanded': !collapsed,
        onClick: () => setCollapsed(current => !current),
        onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setCollapsed(current => !current);
            }
        },
    }, createElement('span', { style: titleStyle }, createElement('span', { style: accentStyle }), 'Ventus 搜索'), createElement('span', { style: { ...chevronStyle, transform: collapsed ? 'none' : 'rotate(180deg)' } }, '▾'));
    const body = collapsed
        ? null
        : createElement('div', { style: bodyStyle }, createElement('label', { style: masterRowStyle }, createElement('span', { style: labelStackStyle }, createElement('span', { style: { fontSize: 13, fontWeight: 600 } }, '启用 Ventus 搜索'), createElement('span', { style: mutedStyle }, '总开关：关闭后搜索与抓取 provider 立即不可用')), createElement('input', {
            type: 'checkbox',
            checked: enabled,
            disabled: saving,
            onChange: (event) => { void toggleMaster(event.target.checked); },
        })), createElement('div', { style: { ...groupStyle, ...(enabled ? {} : disabledStyle) } }, createElement('div', { style: groupHeadStyle }, createElement('span', {}, '引擎'), createElement('button', { style: smallButtonStyle, onClick: () => void refresh() }, '刷新')), ...ENGINE_ROWS.map(({ id, label }) => {
            const engine = engines[id];
            const meta = healthMeta(engine.health);
            const detail = engine.lastError
                ? '上次失败：' + shortError(engine.lastError)
                : engine.lastOkAt
                    ? '上次成功：' + formatTime(engine.lastOkAt)
                    : '尚无运行记录';
            return createElement('div', {
                key: id,
                style: { ...engineRowStyle, ...(hovered === id ? engineRowHoverStyle : {}) },
                onMouseEnter: () => setHovered(id),
                onMouseLeave: () => setHovered(current => (current === id ? null : current)),
            }, createElement('label', { style: checkboxLabelStyle }, createElement('input', {
                type: 'checkbox',
                checked: engine.enabled,
                disabled: !enabled || engineBusy === id,
                onChange: (event) => { void toggleEngine(id, event.target.checked); },
            }), createElement('span', { style: { fontSize: 13 } }, label)), createElement('div', { style: engineInfoStyle }, createElement('div', { style: engineStatusStyle, title: detail }, createElement('span', { style: { ...dotStyle, background: meta.color, color: meta.color } }), createElement('span', {}, meta.label)), createElement('div', { style: engineDetailStyle, title: detail }, detail)));
        })), createElement('div', { style: { ...groupStyle, ...(enabled ? {} : disabledStyle) } }, createElement('div', { style: groupHeadStyle }, createElement('span', {}, '测试搜索')), createElement('div', { style: testRowStyle }, createElement('input', {
            style: testInputStyle,
            value: query,
            maxLength: 200,
            placeholder: '输入查询词（≤200 字符）',
            onChange: (event) => setQuery(event.target.value),
        }), createElement('button', {
            style: primaryButtonStyle,
            disabled: testing || !enabled,
            onClick: () => void runTest(),
        }, testing ? '搜索中…' : '测试搜索')), testResult ? (testResult.ok ? (createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, createElement('div', { style: testMetaStyle }, createElement('span', {}, '耗时 ' + String(testResult.durationMs ?? 0) + 'ms · ' + String(testResult.sources?.length ?? 0) + ' 个来源'), ...(testResult.engines
            ? Object.entries(testResult.engines)
                .filter(([, engine]) => engine.health === 'ok')
                .map(([id]) => createElement('span', { key: id, style: badgeStyle }, (ENGINE_ROWS.find(row => row.id === id)?.label ?? id) + ' ✓'))
            : [])), (testResult.sources && testResult.sources.length > 0) ? createElement('ul', { style: sourceListStyle }, ...testResult.sources.map((source, index) => createElement('li', { key: source.url + '-' + String(index), style: sourceItemStyle }, createElement('a', {
            href: source.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: sourceTitleStyle,
            title: source.title ?? source.url,
        }, source.title ?? source.url), source.snippet ? createElement('div', { style: sourceSnippetStyle }, source.snippet) : null, createElement('div', { style: sourceUrlStyle }, source.url)))) : createElement('div', { style: mutedStyle }, '没有返回来源'))) : (createElement('div', { style: errorStyle }, testResult.error ?? '测试失败'))) : null), error ? createElement('div', { style: errorStyle }, error) : null);
    return createElement('li', { style: cardStyle }, head, body);
}
/** Register the settings card into the Ventus settings list seat. */
export function apply(ctx) {
    const disposeCard = ctx.slots.inject('ventus.settings.item', () => ctx.slots.register({
        name: 'ventus.settings.item',
        id: 'dsh-ventus-search',
        order: 30,
    }, VentusSearchSettingsCard));
    ctx.effect(() => () => { disposeCard(); }, 'dsh-ventus-search: settings card');
}
//# sourceMappingURL=index.js.map