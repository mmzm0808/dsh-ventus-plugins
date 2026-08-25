import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gateConvention, gateNoVerify, transition, verdict } from './gates.js';
test('verdict 三向分流（设计稿 4.3）', () => {
    const band = { pass: 0.01, warn: 0.05 };
    assert.equal(verdict(0, band), 'PASS');
    assert.equal(verdict(0.001, band), 'PASS');
    assert.equal(verdict(0.01, band), 'PASS');
    assert.equal(verdict(0.03, band), 'WARN');
    assert.equal(verdict(0.05, band), 'WARN');
    assert.equal(verdict(0.1, band), 'FAIL');
});
test('verdict 边界：负数按 0、NaN/Infinity 归 FAIL', () => {
    const band = { pass: 1, warn: 2 };
    assert.equal(verdict(-0.5, band), 'PASS');
    assert.equal(verdict(Number.NaN, band), 'FAIL');
    assert.equal(verdict(Number.POSITIVE_INFINITY, band), 'FAIL');
});
test('gateNoVerify 硬闸门：无 verifyRef 或未裁决 → GATE_NO_VERIFY', () => {
    assert.equal(gateNoVerify({ verifyRef: undefined, status: 'adjudicated' }), 'GATE_NO_VERIFY');
    assert.equal(gateNoVerify({ verifyRef: null, status: 'adjudicated' }), 'GATE_NO_VERIFY');
    assert.equal(gateNoVerify({ verifyRef: '', status: 'adjudicated' }), 'GATE_NO_VERIFY');
    assert.equal(gateNoVerify({ verifyRef: 'data/verify_C-014.json', status: 'verified' }), 'GATE_NO_VERIFY');
    assert.equal(gateNoVerify({ verifyRef: 'data/verify_C-014.json', status: 'adjudicated' }), 'PASS');
});
test('gateConvention 口径拒绝：未声明或两侧不同 → CONVENTION_MISMATCH', () => {
    assert.equal(gateConvention('cv-np-cell', 'cv-np-cell'), 'PASS');
    assert.equal(gateConvention('cv-np-cell', 'cv-gap-semi'), 'CONVENTION_MISMATCH');
    assert.equal(gateConvention(undefined, 'cv-np-cell'), 'CONVENTION_MISMATCH');
    assert.equal(gateConvention('cv-np-cell', undefined), 'CONVENTION_MISMATCH');
    assert.equal(gateConvention('', 'cv-np-cell'), 'CONVENTION_MISMATCH');
});
test('transition 状态机主链', () => {
    const chain = [
        ['draft', 'derive', 'derived'],
        ['derived', 'verify-pass', 'verified'],
        ['verified', 'evidence', 'evidenced'],
        ['evidenced', 'adjudicate', 'adjudicated'],
        ['adjudicated', 'publish', 'published'],
        ['published', 'supersede', 'superseded'],
    ];
    for (const [from, action, to] of chain)
        assert.equal(transition(from, action), to);
});
test('transition 状态机旁路', () => {
    assert.equal(transition('derived', 'verify-warn'), 'needs-review');
    assert.equal(transition('derived', 'verify-fail'), 'mismatch');
    assert.equal(transition('needs-review', 'review-fix'), 'derived');
    assert.equal(transition('needs-review', 'verify-pass'), 'verified');
    assert.equal(transition('mismatch', 'review-fix'), 'derived');
    assert.equal(transition('mismatch', 'verify-pass'), 'verified');
});
test('transition 非法迁移返回 null', () => {
    assert.equal(transition('draft', 'publish'), null);
    assert.equal(transition('verified', 'derive'), null);
    assert.equal(transition('superseded', 'adjudicate'), null);
});
//# sourceMappingURL=gates.spec.js.map