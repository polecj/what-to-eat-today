/* 数据格式与输入规则。纯静态脚本，也可由 Node.js 单独测试。 */
(function (root) {
    'use strict';
    const VERSION = 2;
    const UNCATEGORIZED = '未分类';
    const CATEGORY_MAX = 20;
    const NAME_MAX = 80;
    const NAME_SYMBOLS = Object.freeze(['(', ')', '（', '）', '[', ']', '【', '】', '·', '•', '&', '＆', '+', '＋', '-', '—', '_', '.', ',', '，', '。', '!', '！', '?', '？', ':', '：', '、', "'", '’', '‘', '“', '”', '"', '/', '／', '%', '％']);
    const categoryPattern = /^[\p{Script=Han}A-Za-z0-9]+$/u;
    const baseCharacter = /^[\p{Script=Han}A-Za-z0-9]$/u;
    const symbolSet = new Set(NAME_SYMBOLS);
    function isAllowedCharacter(character, kind = 'name') {
        return baseCharacter.test(character) || (kind === 'name' && (character === ' ' || symbolSet.has(character)));
    }
    function filterInput(value, kind = 'name') {
        return [...String(value)].filter(character => isAllowedCharacter(character, kind)).join('');
    }
    const controls = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
    const normalizeName = value => String(value).trim().replace(/ +/g, ' ');
    const normalizeCategory = value => String(value).trim();

    function validateCategory(value) {
        const text = normalizeCategory(value);
        if (!text) return '';
        if ([...text].length > CATEGORY_MAX || !categoryPattern.test(text)) {
            return '类别限 1–20 个汉字、英文字母或数字，不含空格和符号';
        }
        return '';
    }
    function validateName(value) {
        const raw = String(value);
        const text = normalizeName(raw);
        if (!text) return '请填写名称';
        if (controls.test(raw) || filterInput(text) !== text) {
            return '名称含禁用字符；请查看输入格式说明中的完整允许列表';
        }
        if ([...text].length > NAME_MAX) return '名称最多 80 个字符';
        return '';
    }
    function splitItem(value, version = VERSION) {
        const text = String(value).trim();
        const separator = version === 1 ? (text.length > 2 && /\s/.test(text[2]) ? 2 : -1) : text.indexOf(' ');
        if (separator > 0) {
            return { category: text.slice(0, separator), name: text.slice(separator + 1).trimStart() };
        }
        return { category: UNCATEGORIZED, name: text };
    }
    function buildItem(category, name) {
        const cat = normalizeCategory(category);
        const text = normalizeName(name);
        // 显式标记含空格的未分类名称，避免按首个空格误分组。
        return cat && cat !== UNCATEGORIZED ? cat + ' ' + text : (text.includes(' ') ? UNCATEGORIZED + ' ' + text : text);
    }
    function upgradeItem(value) {
        const parts = splitItem(value, 1);
        // 旧内容仅迁移分隔方式，不剔除标点、emoji 或超过新长度限制的历史内容。
        return parts.category !== UNCATEGORIZED ? parts.category + ' ' + parts.name : (parts.name.includes(' ') ? UNCATEGORIZED + ' ' + parts.name : parts.name);
    }
    function parseImport(text) {
        const trimmed = String(text).trim();
        if (!trimmed) throw new Error('导入的列表为空');
        const json = trimmed.startsWith('{') || trimmed.startsWith('[');
        const parsed = json ? JSON.parse(trimmed) : null;
        const version = json && !Array.isArray(parsed) && parsed?.version === VERSION ? VERSION : 1;
        if (json && parsed?.version != null && ![1, VERSION].includes(parsed.version)) throw new Error('不支持此列表版本');
        const list = json ? (Array.isArray(parsed) ? parsed : parsed?.items) : trimmed.split(/\r?\n/);
        if (!Array.isArray(list)) throw new Error('导入文件里没有待抽列表');
        const legacyItems = version === VERSION && Array.isArray(parsed.legacyItems) ? new Set(parsed.legacyItems) : new Set();
        const imported = list.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean).map((item, index) => {
            if (version === 1) return upgradeItem(item);
            const parts = splitItem(item);
            const error = validateCategory(parts.category === UNCATEGORIZED ? '' : parts.category) || validateName(parts.name);
            // 只为从旧版迁移来的原样条目保留往返兼容；新输入始终严格校验。
            if (error && !legacyItems.has(item)) throw new Error('第 ' + (index + 1) + ' 项：' + error);
            return error ? item : buildItem(parts.category, parts.name);
        });
        if (!imported.length && version !== VERSION) throw new Error('导入的列表为空');
        const categories = [...new Set(imported.map(item => splitItem(item).category))];
        const order = Array.isArray(parsed?.categoryOrder) ? parsed.categoryOrder.filter(cat => typeof cat === 'string' && categories.includes(cat)) : [];
        return { items: imported, categoryOrder: [...new Set(order.concat(categories))] };
    }
    function exportData(items, categoryOrder) {
        const legacyItems = items.filter(item => {
            const parts = splitItem(item);
            return validateCategory(parts.category === UNCATEGORIZED ? '' : parts.category) || validateName(parts.name);
        });
        return { version: VERSION, items: [...items], categoryOrder: [...categoryOrder], ...(legacyItems.length ? { legacyItems } : {}) };
    }
    const api = { VERSION, UNCATEGORIZED, CATEGORY_MAX, NAME_MAX, NAME_SYMBOLS, isAllowedCharacter, filterInput, normalizeName, normalizeCategory, validateName, validateCategory, splitItem, buildItem, upgradeItem, parseImport, exportData };
    root.FoodData = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
