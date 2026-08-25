/**
 * dsh-ventus-research — 一次性人类签字令牌（设计稿 4.4）。
 *
 * POST /research-bench/sign → { token, expires: now+300s }；rb_adjudicate
 * 校验 token 存在、未过期、claim_id+revision 匹配，成功后单次删除。
 * 这使得「人工裁决」在技术上不可被 AI 绕过——没有人类在签名端点拿到的
 * 一次性令牌，裁决工具必然返回 NEEDS_HUMAN_SIGNATURE。
 */
import { randomBytes } from 'node:crypto';
/** 令牌有效期（毫秒）。 */
export const SIGNATURE_TTL_MS = 300_000;
/** 进程内令牌表（host 侧；DSH 单实例足够）。 */
export class TokenStore {
    tokens = new Map();
    /** 为一次裁决签发令牌；返回给调用方 token 与过期时间。 */
    issue(claimId, revision) {
        this.prune();
        const token = randomBytes(16).toString('hex');
        const expires = Date.now() + SIGNATURE_TTL_MS;
        this.tokens.set(token, { token, claimId, revision, expires });
        return { token, expires };
    }
    /**
     * 校验并消耗令牌：存在、未过期、claim_id+revision 匹配 → true。
     * 无论结果如何都从表里删除（单次使用）。过期视为无效。
     */
    consume(token, claimId, revision) {
        const entry = this.tokens.get(token);
        if (entry === undefined)
            return false;
        this.tokens.delete(token);
        if (Date.now() > entry.expires)
            return false;
        return entry.claimId === claimId && entry.revision === revision;
    }
    /** 清理过期令牌。 */
    prune() {
        const now = Date.now();
        for (const [token, entry] of this.tokens) {
            if (now > entry.expires)
                this.tokens.delete(token);
        }
    }
    /** 当前有效令牌数（调试/测试用）。 */
    size() {
        this.prune();
        return this.tokens.size;
    }
}
/** 进程级单例。 */
export const signatureTokens = new TokenStore();
//# sourceMappingURL=token.js.map