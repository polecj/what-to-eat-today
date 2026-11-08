const { test } = require('node:test');
const assert = require('node:assert/strict');
const lists = require('../assets/app/list-store.js');
const data = require('../assets/app/data.js');
function storage(values = {}) {
    const map = new Map(Object.entries(values));
    return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
}
test('old secondary records always migrate as full uncategorized names', () => {
    const old = ['Burger King', '一食 兰州拉面', '路边摊🍜', '炸串'];
    const state = lists.decode(JSON.stringify(old));
    assert.deepEqual(state.items.map(item => data.splitItem(item).name), old);
    assert.ok(state.items.every(item => data.splitItem(item).category === '未分类'));
    assert.deepEqual(state.categoryOrder, ['未分类']);
});
test('migration backs up each original list independently and is idempotent', () => {
    const original = JSON.stringify(['Burger King']);
    const store = storage({ picker_wishlist_items: original, picker_snacks_items: JSON.stringify(['炸串']) });
    const first = lists.load('wishlist', store);
    assert.equal(store.getItem('picker_wishlist_items_before_categories_backup'), original);
    assert.deepEqual(lists.load('wishlist', store), first);
    assert.equal(store.getItem('picker_snacks_items'), JSON.stringify(['炸串']));
});
test('new classified data round trips item and category order separately', () => {
    const store = storage();
    const state = { items: ['校外餐馆 火锅', '外卖 Burger King'], categoryOrder: ['外卖', '校外餐馆'], collapsedCategories: ['外卖'] };
    lists.save('snacks', state, store);
    const restored = lists.load('snacks', store);
    assert.deepEqual(restored, { version: 2, ...state });
    assert.equal(store.getItem('picker_wishlist_items'), null);
    assert.equal(store.getItem('picker_items'), null);
});
test('damaged or unknown secondary storage is rejected, not overwritten', () => {
    const store = storage({ picker_snacks_items: '{bad' });
    assert.throws(() => lists.load('snacks', store));
    assert.equal(store.getItem('picker_snacks_items'), '{bad');
    assert.throws(() => lists.decode('{"version":3,"items":[]}'));
});
