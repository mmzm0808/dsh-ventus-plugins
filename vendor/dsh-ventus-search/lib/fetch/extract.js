/**
 * Lightweight Readability-style article extraction: pick the best container
 * (article/main/role=main/class heuristics), strip chrome, and fall back to
 * whole-page text when no readable block is found.
 * @module dsh-ventus-search/fetch/extract
 */
/** Minimum inner-text length before a container counts as "readable". */
const MIN_READABLE_CHARS = 100;
/** Strip script/style/nav/aside/footer blocks from a fragment. */
function stripChrome(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '');
}
/** Extract text between the first occurrence of an opening tag and its close. */
function extractBetween(html, open, close) {
    const start = open.exec(html);
    if (!start)
        return undefined;
    const rest = html.slice(start.index);
    const end = close.exec(rest);
    if (!end)
        return undefined;
    return rest.slice(0, end.index + end[0].length);
}
/** Find the balanced extent of an element starting at an opening tag index. */
function balancedExtent(html, startIndex, tag) {
    const openRe = new RegExp('<' + tag + '(\\s[^>]*)?>', 'ig');
    const closeRe = new RegExp('<\\/' + tag + '>', 'ig');
    openRe.lastIndex = startIndex;
    const open = openRe.exec(html);
    if (!open)
        return undefined;
    let depth = 1;
    let cursor = open.index + open[0].length;
    closeRe.lastIndex = cursor;
    for (;;) {
        const close = closeRe.exec(html);
        if (!close)
            return undefined;
        // Count nested same-tag opens that appear before this close.
        openRe.lastIndex = cursor;
        let nested;
        while ((nested = openRe.exec(html)) !== null && nested.index < close.index) {
            depth++;
        }
        depth--;
        cursor = close.index + close[0].length;
        if (depth <= 0)
            return html.slice(open.index, cursor);
    }
}
/** First element whose tag is article/main or carries role=main / a content class. */
function findContentContainer(html) {
    const tagRe = /<(article|main|section|div)([^>]*)>/gi;
    let match;
    while ((match = tagRe.exec(html)) !== null) {
        const attrs = match[2];
        const tag = match[1];
        if (tag === 'article' ||
            tag === 'main' ||
            /role\s*=\s*["']?main["']?/i.test(attrs) ||
            /(?:class|id)\s*=\s*["'][^"']*(?:article|post|entry|content|main|story|readable|blog)[^"']*["']/i.test(attrs)) {
            const block = balancedExtent(html, match.index, tag);
            if (block !== undefined && textLength(block) >= MIN_READABLE_CHARS)
                return block;
        }
    }
    return undefined;
}
/** Strip tags and collapse whitespace; returns the plain-text length. */
function textLength(fragment) {
    return stripTags(fragment).replace(/\s+/g, ' ').trim().length;
}
/** Strip all tags from a fragment. */
function stripTags(input) {
    return input.replace(/<[^>]*>/g, '');
}
/** Decode common HTML entities. */
function decodeEntities(input) {
    return input
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}
/** Whole page as readable plain text. */
function pageText(html) {
    return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim();
}
/** Escape text for safe inclusion in extracted HTML. */
function escapeHtml(input) {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/** First <title> text, else the first <h1> text. */
function pageTitle(html) {
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (title?.[1])
        return decodeEntities(stripTags(title[1])).trim();
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (h1?.[1])
        return decodeEntities(stripTags(h1[1])).trim();
    return '';
}
/**
 * Extract a readable body from an HTML document.
 * @param html - the raw decoded HTML document.
 * @param url - the page URL (used only for diagnostics/fallback messages).
 * @returns an html-kind body with the extracted container, or a text-kind body
 *   with the whole page text when no readable container exists.
 */
export function extractReadable(html, url) {
    const chromeFree = stripChrome(html);
    const container = extractBetween(chromeFree, /<article[\s>]/i, /<\/article>/i) ??
        extractBetween(chromeFree, /<main[\s>]/i, /<\/main>/i) ??
        findContentContainer(chromeFree);
    if (container !== undefined && textLength(container) >= MIN_READABLE_CHARS) {
        const title = pageTitle(chromeFree);
        const content = title.length > 0 ? '<h1>' + escapeHtml(title) + '</h1>\n' + container.trim() : container.trim();
        return { kind: 'html', content };
    }
    const text = pageText(chromeFree);
    if (text.length === 0) {
        return { kind: 'text', content: 'Ventus fetch: no readable content extracted from ' + url };
    }
    return { kind: 'text', content: text };
}
//# sourceMappingURL=extract.js.map