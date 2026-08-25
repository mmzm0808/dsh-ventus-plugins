/** 令牌有效期（毫秒）。 */
export declare const SIGNATURE_TTL_MS = 300000;
/** 已签发令牌。 */
export interface SignatureToken {
    token: string;
    claimId: string;
    revision: number;
    /** epoch 毫秒过期时间。 */
    expires: number;
}
/** 进程内令牌表（host 侧；DSH 单实例足够）。 */
export declare class TokenStore {
    private readonly tokens;
    /** 为一次裁决签发令牌；返回给调用方 token 与过期时间。 */
    issue(claimId: string, revision: number): {
        token: string;
        expires: number;
    };
    /**
     * 校验并消耗令牌：存在、未过期、claim_id+revision 匹配 → true。
     * 无论结果如何都从表里删除（单次使用）。过期视为无效。
     */
    consume(token: string, claimId: string, revision: number): boolean;
    /** 清理过期令牌。 */
    prune(): void;
    /** 当前有效令牌数（调试/测试用）。 */
    size(): number;
}
/** 进程级单例。 */
export declare const signatureTokens: TokenStore;
