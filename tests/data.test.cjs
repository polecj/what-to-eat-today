const { test } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../assets/app/data.js');

test('categories support 1–20 Han, English and digits, no spaces or punctuation', () => {
    for (const category of ['', '饭', '第一食堂', 'FoodCourt2', '食'.repeat(20)]) assert.equal(data.validateCategory(category), '');
    for (const category of ['食'.repeat(21), '第一 食堂', '外卖!', '🍜']) assert.ok(data.validateCategory(category));
});
test('names keep common punctuation and reject markup, controls and emoji', () => {
    for (const name of ['肯德基（北门店）', '7-11', '麦当劳·甜品站', 'Burger King', '鱼&饭+茶/咖啡', 'Bob\'s (Shop)', '饭'.repeat(80)]) assert.equal(data.validateName(name), '');
    for (const name of ['', ' ', '<script>', '饭🍜', '饭\n菜', '饭\t菜', '饭\u200b菜', '饭'.repeat(81)]) assert.ok(data.validateName(name), name);
});
test('first-space parsing and uncategorized names are unambiguous', () => {
    assert.deepEqual(data.splitItem('第一食堂 Burger King'), { category: '第一食堂', name: 'Burger King' });
    const item = data.buildItem('', ' Burger  King ');
    assert.equal(item, '未分类 Burger King');
    assert.deepEqual(data.splitItem(item), { category: '未分类', name: 'Burger King' });
    assert.equal(data.buildItem('', '牛肉面'), '牛肉面');
});
test('legacy JSON object, array and line share payload preserve old grouping', () => {
    const items = ['一食 兰州拉面', 'Burger King', '第一食堂 牛肉面', '吃面🍜'];
    const expected = ['一食 兰州拉面', '未分类 Burger King', '未分类 第一食堂 牛肉面', '吃面🍜'];
    for (const text of [JSON.stringify({ version: 1, items }), JSON.stringify(items), items.join('\n')]) {
        assert.deepEqual(data.parseImport(text).items, expected);
    }
});
test('new format round trips long categories, order and historical contents', () => {
    const items = ['第一食堂 牛肉面（小碗）', '未分类 Burger King', '吃面🍜'];
    const order = ['未分类', '第一食堂'];
    const exported = data.exportData(items, order);
    assert.equal(exported.version, 2);
    assert.deepEqual(exported.legacyItems, ['吃面🍜']);
    const imported = data.parseImport(JSON.stringify(exported));
    assert.deepEqual(imported.items, items);
    assert.deepEqual(imported.categoryOrder, order);
});
test('new version import validates without silently losing entries', () => {
    assert.throws(() => data.parseImport('{"version":2,"items":["第一 食堂<坏>"]}'), /第 1 项/);
    assert.throws(() => data.parseImport('{"version":3,"items":[]}'), /版本/);
    assert.throws(() => data.parseImport(''), /为空/);
    assert.deepEqual(data.parseImport('{"version":2,"items":[]}').items, []);
});
