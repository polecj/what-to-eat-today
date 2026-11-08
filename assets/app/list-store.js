/* 三个清单使用相同的 version 2 项目格式；旧轻清单数组始终按完整名称迁移。 */
(function (root) {
    'use strict';
    const data = root.FoodData || (typeof require === 'function' ? require('./data.js') : null);
    const keys = { wishlist: 'picker_wishlist_items', snacks: 'picker_snacks_items' };
    function decode(raw) {
        if (!raw) return { version: 2, items: [], categoryOrder: [], collapsedCategories: [] };
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            if (parsed.some(item => typeof item !== 'string')) throw new Error('清单包含非文本记录');
            // 不使用 upgradeItem：旧轻清单从来没有分类，中文或英文空格也是名称的一部分。
            const items = parsed.filter(item => item.trim()).map(name => name.includes(' ') ? '未分类 ' + name : name);
            return { version: 2, items, categoryOrder: items.length ? ['未分类'] : [], collapsedCategories: [] };
        }
        if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.items) || parsed.items.some(item => typeof item !== 'string')) throw new Error('清单格式不受支持');
        const categories = [...new Set(parsed.items.map(item => data.splitItem(item).category))];
        const order = Array.isArray(parsed.categoryOrder) ? parsed.categoryOrder.filter(cat => categories.includes(cat)) : [];
        const collapsed = Array.isArray(parsed.collapsedCategories) ? parsed.collapsedCategories.filter(cat => categories.includes(cat)) : [];
        return { version: 2, items: [...parsed.items], categoryOrder: [...new Set(order.concat(categories))], collapsedCategories: collapsed };
    }
    function load(section, storage) {
        const key = keys[section];
        if (!key) throw new Error('未知清单');
        const raw = storage.getItem(key);
        const state = decode(raw);
        if (raw && Array.isArray(JSON.parse(raw))) {
            if (!storage.getItem(key + '_before_categories_backup')) storage.setItem(key + '_before_categories_backup', raw);
            storage.setItem(key, JSON.stringify(state));
        }
        return state;
    }
    function save(section, state, storage) {
        const key = keys[section];
        if (!key) throw new Error('未知清单');
        const record = { version: 2, items: [...state.items], categoryOrder: [...state.categoryOrder], collapsedCategories: [...state.collapsedCategories] };
        storage.setItem(key, JSON.stringify(record));
    }
    const api = { keys, decode, load, save };
    root.FoodLists = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
