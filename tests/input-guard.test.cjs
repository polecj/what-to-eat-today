const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const FoodData = require('../assets/app/data.js');
function setup(kind = 'name', initial = '') {
    const events = new Map();
    let notices = 0;
    const root = { FoodData, showToast: () => notices++ };
    const input = {
        value: initial, selectionStart: initial.length, selectionEnd: initial.length, maxLength: 80,
        addEventListener(name, handler) { if (!events.has(name)) events.set(name, []); events.get(name).push(handler); },
        dispatchEvent(event) { for (const fn of events.get(event.type) || []) fn(event); },
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
        setRangeText(text, start, end) { this.value = this.value.slice(0, start) + text + this.value.slice(end); this.setSelectionRange(start + text.length, start + text.length); },
        setCustomValidity() {}
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../assets/app/input-guard.js'), 'utf8'), { window: root, document: { getElementById: () => null }, Event: class { constructor(type) { this.type = type; } } });
    root.FoodInput.bind(input, kind);
    const emit = (type, data = {}) => { const event = { type, preventDefault() { this.defaultPrevented = true; }, ...data }; input.dispatchEvent(event); return event; };
    return { input, emit, notices: () => notices };
}
test('beforeinput rejects only invalid inserted symbols, preserving selected text and caret', () => {
    const { input, emit, notices } = setup('name', '饭菜');
    input.setSelectionRange(1, 1);
    const event = emit('beforeinput', { inputType: 'insertText', data: '<面🍜>', cancelable: true });
    assert.ok(event.defaultPrevented);
    assert.equal(input.value, '饭面菜');
    assert.equal(input.selectionStart, 2);
    assert.equal(notices(), 1);
});
test('paste keeps valid content and excludes disallowed characters without clearing other text', () => {
    const { input, emit } = setup('name', '牛肉');
    input.setSelectionRange(2, 2);
    emit('paste', { clipboardData: { getData: () => '面<🍜>（小碗）' } });
    assert.equal(input.value, '牛肉面（小碗）');
});
test('IME is not altered during composition; completed text is filtered', () => {
    const { input, emit, notices } = setup('category', '第一');
    emit('compositionstart');
    input.value = '第一食🍜堂';
    input.setSelectionRange(input.value.length, input.value.length);
    emit('input', { isComposing: true });
    assert.equal(input.value, '第一食🍜堂');
    assert.equal(notices(), 0);
    emit('compositionend');
    assert.equal(input.value, '第一食堂');
    assert.equal(notices(), 1);
});
test('fallback input filtering leaves preexisting legacy emoji intact', () => {
    const { input, emit } = setup('name', '旧🍜名称');
    input.value += '<新>'; input.setSelectionRange(input.value.length, input.value.length);
    emit('input');
    assert.equal(input.value, '旧🍜名称新');
});
