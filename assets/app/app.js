const STORAGE_KEY = 'picker_items';
const CATEGORY_ORDER_KEY = 'picker_category_order';
const COLLAPSED_CATEGORIES_KEY = 'picker_collapsed_categories';
const UNCHECKED_CATEGORIES_KEY = 'picker_unchecked_categories';
const DRAW_HISTORY_KEY = 'picker_draw_history';
const PICK_COUNTS_KEY = 'picker_pick_counts';
const EATEN_COUNTS_KEY = 'picker_eaten_counts';
const GUIDE_PROMPT_DISABLED_KEY = 'picker_guide_prompt_disabled';
const DRAW_DURATION_KEY = 'picker_draw_duration_seconds';
const DRAW_DURATION_DEFAULT = 2.5;
const DRAW_DURATION_MIN = 0.3;
const DRAW_DURATION_MAX = 8;
const DRAW_WEIGHTS_KEY = 'picker_draw_weights';
const WEIGHT_OPTIONS = [
    { value: 'less', label: '更少出现' },
    { value: 'normal', label: '正常' },
    { value: 'more', label: '更多出现' },
];
const UNCATEGORIZED = '未分类';

// 从 localStorage 读取
function loadItems() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : parsed?.items;
        return Array.isArray(list) ? list.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
    } catch { return []; }
}

function isTeachingStorageActive() {
    return document.body?.classList?.contains('teaching-mode') && savedMainState;
}

// 写入 localStorage
function saveItems(items) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadCategoryOrder() {
    try {
        const raw = localStorage.getItem(CATEGORY_ORDER_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveCategoryOrder(order) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(order));
}

function loadCollapsedCategories() {
    try {
        const raw = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveCollapsedCategories(categories) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(categories));
}

function loadUncheckedCategories() {
    try {
        const raw = localStorage.getItem(UNCHECKED_CATEGORIES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveUncheckedCategories(categories) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(UNCHECKED_CATEGORIES_KEY, JSON.stringify(categories));
}

function loadDrawHistory() {
    try {
        const raw = localStorage.getItem(DRAW_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
    } catch { return []; }
}

function saveDrawHistory(history) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(DRAW_HISTORY_KEY, JSON.stringify(history));
}

function loadPickCounts() {
    try {
        const raw = localStorage.getItem(PICK_COUNTS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch { return {}; }
}

function savePickCounts(counts) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(PICK_COUNTS_KEY, JSON.stringify(counts));
}

function incrementPickCount(item) {
    if (!item || isTeachingStorageActive()) return;
    pickCounts[item] = (pickCounts[item] || 0) + 1;
    savePickCounts(pickCounts);
    render();
}

function loadEatenCounts() {
    try {
        var raw = localStorage.getItem(EATEN_COUNTS_KEY);
        if (!raw) return {};
        var parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch { return {}; }
}

function saveEatenCounts(counts) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(EATEN_COUNTS_KEY, JSON.stringify(counts));
}

function incrementEatenCount(item) {
    if (!item || isTeachingStorageActive()) return;
    eatenCounts[item] = (eatenCounts[item] || 0) + 1;
    saveEatenCounts(eatenCounts);
    render();
}

function resetPickCounts() {
    pickCounts = {};
    eatenCounts = {};
    savePickCounts(pickCounts);
    saveEatenCounts(eatenCounts);
    render();
    if (currentMode === 'tags') renderTagBoard();
    showToast('统计数据已归零');
}

function isGuidePromptDisabled() {
    return localStorage.getItem(GUIDE_PROMPT_DISABLED_KEY) === '1';
}

function setGuidePromptDisabled() {
    localStorage.setItem(GUIDE_PROMPT_DISABLED_KEY, '1');
}

function getWeightMultiplier(weight) {
    if (weight === 'less') return 0.5;
    if (weight === 'more') return 2;
    return 1;
}

function loadDrawWeights() {
    try {
        const raw = localStorage.getItem(DRAW_WEIGHTS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch { return {}; }
}

function saveDrawWeights(weights) {
    if (isTeachingStorageActive()) return;
    var cleaned = {};
    var keys = Object.keys(weights);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = weights[k];
        if (v && v !== 'normal') cleaned[k] = v;
    }
    if (Object.keys(cleaned).length === 0) {
        localStorage.removeItem(DRAW_WEIGHTS_KEY);
    } else {
        localStorage.setItem(DRAW_WEIGHTS_KEY, JSON.stringify(cleaned));
    }
}

function loadDrawDurationSeconds() {
    const value = parseFloat(localStorage.getItem(DRAW_DURATION_KEY));
    if (!Number.isFinite(value)) return DRAW_DURATION_DEFAULT;
    return Math.min(DRAW_DURATION_MAX, Math.max(DRAW_DURATION_MIN, Math.round(value * 10) / 10));
}

function saveDrawDurationSeconds(value) {
    if (isTeachingStorageActive()) return;
    localStorage.setItem(DRAW_DURATION_KEY, value.toFixed(1));
}

function setDrawDurationSeconds(value) {
    drawDurationSeconds = Math.min(DRAW_DURATION_MAX, Math.max(DRAW_DURATION_MIN, Math.round(value * 10) / 10));
    saveDrawDurationSeconds(drawDurationSeconds);
    updateDrawDurationDisplay();
}

function updateDrawDurationDisplay() {
    var valueEl = document.getElementById('drawDurationValue');
    if (valueEl) valueEl.textContent = drawDurationSeconds.toFixed(1) + 's';
    var minusBtn = document.getElementById('drawDurationMinusBtn');
    if (minusBtn) minusBtn.disabled = drawDurationSeconds <= DRAW_DURATION_MIN;
    var plusBtn = document.getElementById('drawDurationPlusBtn');
    if (plusBtn) plusBtn.disabled = drawDurationSeconds >= DRAW_DURATION_MAX;
}

let items = loadItems();
let categoryOrder = loadCategoryOrder();
let collapsedCategories = loadCollapsedCategories();
let uncheckedCategories = loadUncheckedCategories();
let autoExpandedCategory = '';
let resultHidden = false;
let latestResultText = '';
let currentMode = 'normal';
let tagExpandedCategories = [];
let tagLayout = [];
let tagMotionOn = false;
let tagMotionFrame = null;
let tagInertiaOn = false;
let tagInertiaStart = 0;
let lastMotionTime = 0;
let tagMotionSpeed = 4.5;
let tagDrawRunning = false;
let pendingImportData = null;
let undoImportState = null;
let exportReminderTimer = null;
let toastTimer = null;
let hasUnsavedExport = false;
let listSearchQuery = '';
let bulkEditCategory = '';
let drawHistory = loadDrawHistory();
let drawHistoryCollapsed = true;
let pickCounts = loadPickCounts();
let eatenCounts = loadEatenCounts();
let drawDurationSeconds = loadDrawDurationSeconds();
let drawWeights = loadDrawWeights();
let activeItemPopoverIndex = -1;
let categoriesToAnimate = new Set();
let categoriesToHighlight = new Set();
let itemsToHighlight = new Set();
let newItemsUntilNextDraw = new Set();
let teachingItems = [];
let teachingCategoryOrder = [];
let savedMainState = null;
let suppressNextListAnimation = false;
let teachingStep = 0;
let teachingLatestStep = 0;
let teachingStep4Released = false;
let teachingStep4ReleaseTimer = null;
let teachingPickDone = false;
let teachingConfirmDone = false;
let teachingMockImportDone = false;
let teachingFeatureIndex = 0;
let ignoreNextEditOutsideClick = false;
let guideAttentionDismissed = false;
let guideTipFadeTimer = null;

function getItemCategory(item) {
    const val = item.trim();
    if (val.length > 2 && /\s/.test(val[2])) {
        return val.slice(0, 2);
    }
    return UNCATEGORIZED;
}

function getOrderedCategories(categories) {
    const categorySet = new Set(categories);
    const ordered = categoryOrder.filter(category => categorySet.has(category));
    const missing = categories
        .filter(category => !ordered.includes(category))
        .sort((a, b) => {
            if (a === UNCATEGORIZED) return 1;
            if (b === UNCATEGORIZED) return -1;
            return a.localeCompare(b, 'zh-CN');
        });
    return ordered.concat(missing);
}

function buildGroups() {
    const groupMap = new Map();

    items.forEach((item, index) => {
        const category = getItemCategory(item);
        if (!groupMap.has(category)) {
            groupMap.set(category, []);
        }
        groupMap.get(category).push({ item, index });
    });

    const categories = getOrderedCategories([...groupMap.keys()]);
    return categories.map(category => ({
        category,
        items: groupMap.get(category)
    }));
}

function flattenGroups(groups) {
    return groups.flatMap(group => group.items.map(({ item }) => item));
}

function insertItemByTime(val) {
    const category = getItemCategory(val);
    let insertAt = items.length;
    for (let i = items.length - 1; i >= 0; i--) {
        if (getItemCategory(items[i]) === category) {
            insertAt = i + 1;
            break;
        }
    }
    items.splice(insertAt, 0, val);
}

function sortItemsWithinGroups(shouldRender = true) {
    sortItems(shouldRender);
}

function moveItemWithinCategory(fromIndex, toIndex, insertAfter = false) {
    const fromItem = items[fromIndex];
    const toItem = items[toIndex];
    if (!fromItem || !toItem) return false;

    const category = getItemCategory(fromItem);
    if (category !== getItemCategory(toItem)) return false;

    const categoryItems = items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => getItemCategory(item) === category);
    const fromPos = categoryItems.findIndex(({ index }) => index === fromIndex);
    const targetPos = categoryItems.findIndex(({ index }) => index === toIndex);
    if (fromPos < 0 || targetPos < 0) return false;

    const orderedCategoryItems = categoryItems.map(({ item }) => item);
    const [moved] = orderedCategoryItems.splice(fromPos, 1);
    let insertPos = targetPos;
    if (fromPos < targetPos) insertPos--;
    if (insertAfter) insertPos++;
    if (insertPos < 0) insertPos = 0;
    if (insertPos > orderedCategoryItems.length) insertPos = orderedCategoryItems.length;
    if (fromPos === insertPos) return false;
    orderedCategoryItems.splice(insertPos, 0, moved);

    let nextCategoryItem = 0;
    items = items.map(item => {
        if (getItemCategory(item) !== category) return item;
        return orderedCategoryItems[nextCategoryItem++];
    });
    saveItems(items);
    return true;
}

function syncCategoryOrder(groups) {
    categoryOrder = groups.map(group => group.category);
    saveCategoryOrder(categoryOrder);
    cleanupCollapsedCategories(categoryOrder);
}

function cleanupCollapsedCategories(categories) {
    collapsedCategories = collapsedCategories.filter(category => categories.includes(category));
    saveCollapsedCategories(collapsedCategories);
    cleanupUncheckedCategories(categories);
}

function cleanupUncheckedCategories(categories) {
    uncheckedCategories = uncheckedCategories.filter(category => categories.includes(category));
    saveUncheckedCategories(uncheckedCategories);
}

function isCategoryDrawEnabled(category) {
    return !uncheckedCategories.includes(category);
}

function getDrawableItems() {
    return items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => isCategoryDrawEnabled(getItemCategory(item)));
}

function getDrawableItemIndexes() {
    return new Set(getDrawableItems().map(({ index }) => index));
}

function weightedDrawablePick() {
    var drawable = getDrawableItems();
    if (drawable.length === 0) return null;
    var weights = drawable.map(function (d) { return getWeightMultiplier(drawWeights[d.item] || 'normal'); });
    var totalWeight = weights.reduce(function (sum, w) { return sum + w; }, 0);
    var r = Math.random() * totalWeight;
    for (var i = 0; i < drawable.length; i++) {
        r -= weights[i];
        if (r <= 0) return drawable[i];
    }
    return drawable[drawable.length - 1];
}

var itemPopoverIndex = -1;

function openItemPopover(index, buttonEl) {
    itemPopoverIndex = index;
    closeItemPopover(true);
    var item = items[index];
    var currentWeight = drawWeights[item] || 'normal';
    var popover = document.createElement('div');
    popover.className = 'item-popover';
    popover.id = 'itemPopover';

    var weightHtml = '';
    for (var wi = 0; wi < WEIGHT_OPTIONS.length; wi++) {
        var opt = WEIGHT_OPTIONS[wi];
        var active = opt.value === currentWeight;
        weightHtml += '<button class="item-popover-item weight-option' + (active ? ' active' : '') + '" data-weight="' + opt.value + '">'
            + '<span class="weight-dot">' + (active ? '\u25cf' : '\u00b7') + '</span>'
            + '<span>' + opt.label + '</span>'
            + '</button>';
    }

    popover.innerHTML = '<button class="item-popover-item" data-action="edit">\u7f16\u8f91</button>'
        + '<span class="item-popover-divider"></span>'
        + '<span class="item-popover-label">\u62bd\u51fa\u6743\u91cd</span>'
        + weightHtml
        + '<span class="item-popover-divider"></span>'
        + '<button class="item-popover-item item-popover-danger" data-action="delete">\u5220\u9664</button>';

    document.body.appendChild(popover);

    var btnRect = buttonEl.getBoundingClientRect();
    var popoverRect = popover.getBoundingClientRect();
    var popoverWidth = popoverRect.width || 144;
    var popoverHeight = popoverRect.height || 140;
    var left = Math.min(btnRect.right - popoverWidth, window.innerWidth - popoverWidth - 8);
    var top = btnRect.bottom + 4;
    if (top + popoverHeight > window.innerHeight - 8) {
        top = btnRect.top - popoverHeight - 4;
    }
    popover.style.left = Math.max(8, left) + 'px';
    popover.style.top = top + 'px';

    popover.addEventListener('click', function (e) {
        var actionBtn = e.target.closest('[data-action]');
        var weightBtn = e.target.closest('[data-weight]');
        if (actionBtn) {
            var action = actionBtn.dataset.action;
            if (action === 'edit') { closeItemPopover(); startEdit(index); return; }
            if (action === 'delete') {
                closeItemPopover();
                items.splice(index, 1);
                sortItems(false);
                tagLayout = [];
                suppressNextListAnimation = true;
                render();
                if (document.body.classList.contains('teaching-mode')) setTeachingStep(teachingStep);
                if (currentMode === 'tags') renderTagBoard();
                markListChanged();
                return;
            }
        }
        if (weightBtn) {
            var w = weightBtn.dataset.weight;
            var newWeights = {};
            var wk = Object.keys(drawWeights);
            for (var wi = 0; wi < wk.length; wi++) newWeights[wk[wi]] = drawWeights[wk[wi]];
            if (w === 'normal') { delete newWeights[item]; } else { newWeights[item] = w; }
            drawWeights = newWeights;
            saveDrawWeights(drawWeights);
            closeItemPopover();
            render();
        }
    });

    setTimeout(function () { popover.classList.add('show'); }, 0);
}

function closeItemPopover(skipState) {
    var popover = document.getElementById('itemPopover');
    if (popover) popover.remove();
    if (!skipState) itemPopoverIndex = -1;
}

function addDrawHistory(item) {
    if (!item || isTeachingStorageActive()) return;
    clearUndoImportState();
    drawHistory = [item, ...drawHistory].slice(0, 30);
    saveDrawHistory(drawHistory);
    renderDrawHistory();
}

function deleteDrawHistoryItem(index) {
    drawHistory.splice(index, 1);
    saveDrawHistory(drawHistory);
    renderDrawHistory();
}

function clearDrawHistory() {
    drawHistory = [];
    saveDrawHistory(drawHistory);
    renderDrawHistory();
}

var statsShowPick = true;
var statsShowEaten = true;

function renderStats() {
    var body = document.querySelector('.stats-body');
    if (!body) return;

    if (items.length === 0) {
        body.innerHTML = '<p class="stats-placeholder">还没有项目，先添加一些再来看统计吧</p>';
        return;
    }

    var sorted = items.map(function (item, i) {
        var displayName = getItemNameInCategory(item, getItemCategory(item));
        return { name: displayName, pick: pickCounts[item] || 0, eaten: eatenCounts[item] || 0, index: i };
    }).sort(function (a, b) { return b.pick - a.pick || a.name.localeCompare(b.name, 'zh-CN'); });

    var maxVal = 1;
    for (var i = 0; i < sorted.length; i++) {
        var v = 0;
        if (statsShowPick && sorted[i].pick > v) v = sorted[i].pick;
        if (statsShowEaten && sorted[i].eaten > v) v = sorted[i].eaten;
        if (v > maxVal) maxVal = v;
    }

    var html = '<div class="stats-chart">';
    for (var i = 0; i < sorted.length; i++) {
        var entry = sorted[i];
        html += '<div class="stats-row">'
            + '<span class="stats-item-name">' + escapeHtml(entry.name) + '</span>'
            + '<span class="stats-bar-wrap">';

        if (statsShowPick && statsShowEaten) {
            var pickW = maxVal > 0 ? Math.max(2, Math.round(entry.pick / maxVal * 100)) : 0;
            var eatenW = maxVal > 0 ? Math.max(2, Math.round(entry.eaten / maxVal * 100)) : 0;
            if (entry.pick >= entry.eaten) {
                html += '<span class="stats-bar stats-bar-pick" style="width:' + pickW + '%"></span>'
                    + '<span class="stats-bar stats-bar-eaten" style="width:' + eatenW + '%"></span>';
            } else {
                html += '<span class="stats-bar stats-bar-eaten" style="width:' + eatenW + '%"></span>'
                    + '<span class="stats-bar stats-bar-pick" style="width:' + pickW + '%"></span>';
            }
        } else if (statsShowPick) {
            var pw = maxVal > 0 ? Math.max(2, Math.round(entry.pick / maxVal * 100)) : 0;
            html += '<span class="stats-bar stats-bar-pick" style="width:' + pw + '%"></span>';
        } else if (statsShowEaten) {
            var ew = maxVal > 0 ? Math.max(2, Math.round(entry.eaten / maxVal * 100)) : 0;
            html += '<span class="stats-bar stats-bar-eaten" style="width:' + ew + '%"></span>';
        } else {
            html += '<span class="stats-bar" style="width:0"></span>';
        }

        html += '</span>'
            + '<span class="stats-item-count">' + (statsShowPick ? entry.pick : '') + '</span>'
            + '<span class="stats-item-eaten">' + (statsShowEaten ? entry.eaten : '') + '</span>'
            + '</div>';
    }
    html += '</div>';

    body.innerHTML = html;
}

function renderDrawHistory() {
    const panel = document.getElementById('drawHistoryPanel');
    const list = document.getElementById('drawHistoryList');
    const clearBtn = document.getElementById('clearDrawHistoryBtn');
    const toggleBtn = document.getElementById('toggleDrawHistoryBtn');
    if (!panel || !list || !clearBtn || !toggleBtn) return;
    panel.classList.toggle('empty', drawHistory.length === 0);
    panel.classList.toggle('collapsed', drawHistoryCollapsed);
    clearBtn.disabled = drawHistory.length === 0;
    toggleBtn.textContent = drawHistoryCollapsed ? '展开' : '折叠';
    toggleBtn.title = drawHistoryCollapsed ? '展开抽取历史' : '折叠抽取历史';
    if (drawHistory.length === 0) {
        list.innerHTML = '<li class="draw-history-empty">暂无历史</li>';
        return;
    }
    list.innerHTML = drawHistory.map((item, index) => `
<li class="draw-history-item">
  <span>${escapeHtml(item)}</span>
  <button class="delete-history-btn" data-index="${index}" title="删除这条历史">×</button>
</li>`).join('');
    list.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteDrawHistoryItem(parseInt(this.dataset.index));
        });
    });
}

function toggleDrawHistory() {
    drawHistoryCollapsed = !drawHistoryCollapsed;
    renderDrawHistory();
}

function areAllDrawCategoriesEnabled() {
    const categories = getAllCategories();
    return categories.length === 0 || categories.every(category => isCategoryDrawEnabled(category));
}

function updateDrawScopeAllButton() {
    const btn = document.getElementById('drawScopeAllBtn');
    if (!btn) return;
    const allEnabled = areAllDrawCategoriesEnabled();
    btn.classList.toggle('active', allEnabled);
    btn.textContent = '全选';
    btn.title = allEnabled ? '点击后全不选抽取范围' : '点击后全选抽取范围';
}

function toggleAllDrawCategories() {
    const categories = getAllCategories();
    if (categories.length === 0) return;
    uncheckedCategories = areAllDrawCategoriesEnabled() ? [...categories] : [];
    saveUncheckedCategories(uncheckedCategories);
    clearTagDrawHighlight();
    if (currentMode === 'tags' && getDrawableItems().length === 0) stopTagMotion(false);
    render();
    if (currentMode === 'tags') renderTagBoard();
}

function toggleCategoryDrawEnabled(category) {
    if (isCategoryDrawEnabled(category)) {
        uncheckedCategories.push(category);
    } else {
        uncheckedCategories = uncheckedCategories.filter(item => item !== category);
    }
    saveUncheckedCategories(uncheckedCategories);
    clearTagDrawHighlight();
    if (currentMode === 'tags' && getDrawableItems().length === 0) stopTagMotion(false);
    render();
    if (currentMode === 'tags') renderTagBoard();
}

function isCategoryCollapsed(category) {
    if (currentMode === 'tags') {
        return !tagExpandedCategories.includes(category);
    }
    return collapsedCategories.includes(category);
}

function toggleTagCategory(category) {
    if (tagExpandedCategories.includes(category)) {
        collapseCategoryWithAnimation(category, () => {
            tagExpandedCategories = tagExpandedCategories.filter(item => item !== category);
            render();
        });
    } else {
        tagExpandedCategories.push(category);
        categoriesToAnimate.add(category);
        render();
    }
}

function collapseCategoryWithAnimation(category, afterCollapse) {
    const rows = document.querySelectorAll(`li.item-row[data-category="${CSS.escape(category)}"]`);
    if (rows.length === 0) {
        afterCollapse();
        return;
    }
    rows.forEach(row => row.classList.add('collapsing'));
    setTimeout(afterCollapse, 160);
}

function toggleCategory(category) {
    if (currentMode === 'tags') {
        toggleTagCategory(category);
        return;
    }

    if (!isCategoryCollapsed(category)) {
        collapseCategoryWithAnimation(category, () => {
            collapsedCategories.push(category);
            if (autoExpandedCategory === category) {
                autoExpandedCategory = '';
            }
            saveCollapsedCategories(collapsedCategories);
            render();
        });
        return;
    }

    collapsedCategories = collapsedCategories.filter(item => item !== category);
    if (autoExpandedCategory === category) {
        autoExpandedCategory = '';
    }
    saveCollapsedCategories(collapsedCategories);
    categoriesToAnimate.add(category);
    render();
}

function expandCategory(category) {
    if (!isCategoryCollapsed(category)) return false;
    collapsedCategories = collapsedCategories.filter(item => item !== category);
    saveCollapsedCategories(collapsedCategories);
    return true;
}

function collapseCategory(category) {
    if (isCategoryCollapsed(category)) return false;
    collapsedCategories.push(category);
    saveCollapsedCategories(collapsedCategories);
    return true;
}

function collapseAutoExpandedCategory() {
    if (!autoExpandedCategory) return false;
    const changed = collapseCategory(autoExpandedCategory);
    autoExpandedCategory = '';
    return changed;
}

function setResultText(text, shouldRoll = false, duration = 120) {
    latestResultText = text;
    const resultEl = document.getElementById('result');
    resultEl.innerHTML = '';
    if (resultHidden) return;

    const textEl = document.createElement('span');
    textEl.className = 'result-text';
    textEl.textContent = text;
    if (shouldRoll) {
        textEl.classList.add('rolling');
        textEl.style.animationDuration = `${duration}ms`;
    }
    resultEl.appendChild(textEl);
}

function setResultBlur(progress) {
    const resultEl = document.getElementById('result');
    const blur = Math.max(0, 24 * (1 - progress));
    resultEl.style.filter = `blur(${blur}px)`;
}

function clearResultBlur() {
    const resultEl = document.getElementById('result');
    resultEl.style.filter = '';
}

function showResultConfirm() {
    const toggleBtn = document.getElementById('toggleResultBtn');
    toggleBtn.textContent = '确定';
    toggleBtn.style.display = 'inline-block';
    toggleBtn.disabled = document.body.classList.contains('teaching-mode') && teachingStep !== 6;
}

function hideResultConfirm() {
    const toggleBtn = document.getElementById('toggleResultBtn');
    toggleBtn.style.display = 'none';
}

function clearPickHighlight() {
    document.querySelectorAll('li.highlight').forEach(el => el.classList.remove('highlight'));
}

function toggleResult() {
    resultHidden = true;
    const resultEl = document.getElementById('result');
    resultEl.textContent = '';
    resultEl.classList.add('hidden-result');
    latestResultText = '';
    hideResultConfirm();
    clearPickHighlight();
    if (document.body.classList.contains('teaching-mode') && teachingStep === 6) {
        teachingConfirmDone = true;
        document.getElementById('teachingNextBtn')?.classList.add('teaching-highlight');
        updateTeachingNextState();
    }
}

function flashTagDrawButton() {
    const drawBtn = document.getElementById('drawTagBtn');
    if (!drawBtn) return;
    drawBtn.classList.remove('tag-draw-attention');
    void drawBtn.offsetWidth;
    drawBtn.classList.add('tag-draw-attention');
}

function switchMode(mode) {
    currentMode = mode;
    document.body.classList.toggle('tag-mode', mode === 'tags');
    document.body.classList.toggle('normal-mode', mode === 'normal');
    document.getElementById('normalModeBtn').classList.toggle('active', mode === 'normal');
    document.getElementById('tagModeBtn').classList.toggle('active', mode === 'tags');
    document.getElementById('tagRevealOverlay').classList.remove('show');
    document.querySelector('.right-panel').classList.remove('drawer-open');

    if (mode === 'tags') {
        tagExpandedCategories = [];
        shuffleTags();
        flashTagDrawButton();
    } else {
        stopTagMotion(false);
    }
    render();
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function createTagLayout() {
    const isMobile = window.matchMedia?.('(max-width: 640px)').matches;
    tagLayout = items.map((_, index) => ({
        index,
        left: isMobile ? randomBetween(4, 78) : randomBetween(16, 70),
        top: isMobile ? randomBetween(6, 86) : randomBetween(16, 68),
        rotate: isMobile ? randomBetween(-24, 24) : randomBetween(-38, 38),
        scale: isMobile ? randomBetween(0.78, 1.05) : randomBetween(0.92, 1.2),
        hue: Math.floor(randomBetween(165, 285)),
        z: index + Math.floor(randomBetween(0, 20)),
        vx: randomBetween(-90, 90) || 55,
        vy: randomBetween(-90, 90) || -55
    }));
}

function applyTagLayout() {
    const board = document.getElementById('tagBoard');
    if (!board) return;
    tagLayout.forEach(layout => {
        const tag = board.querySelector(`.mystery-tag[data-index="${layout.index}"]`);
        if (!tag) return;
        tag.style.left = `${layout.left}%`;
        tag.style.top = `${layout.top}%`;
        tag.style.transform = `rotate(${layout.rotate}deg) scale(${layout.scale})`;
        tag.style.zIndex = layout.z;
        tag.style.setProperty('--tag-hue', layout.hue);
    });
}

function renderTagBoard() {
    const board = document.getElementById('tagBoard');
    if (!board) return;
    if (items.length === 0) {
        board.innerHTML = '<div class="tag-empty"><strong>还没有标签</strong><span>从左侧箭头添加项目，或打开右侧列表导入。</span></div>';
        return;
    }
    if (tagLayout.length !== items.length) createTagLayout();
    board.innerHTML = tagLayout.map(layout => {
        const disabled = !isCategoryDrawEnabled(getItemCategory(items[layout.index] || ''));
        return `
<button class="mystery-tag${disabled ? ' draw-disabled' : ''}" data-index="${layout.index}" style="left:${layout.left}%; top:${layout.top}%; transform: rotate(${layout.rotate}deg) scale(${layout.scale}); z-index:${layout.z}; --tag-hue:${layout.hue};" ${disabled ? 'disabled' : ''}>?</button>
    `;
    }).join('');

    board.querySelectorAll('.mystery-tag:not(.draw-disabled)').forEach(tag => {
        tag.addEventListener('click', function (e) {
            e.stopPropagation();
            revealTag(parseInt(this.dataset.index));
        });
    });
}

function shuffleTags() {
    const shouldKeepMoving = currentMode === 'tags' && tagMotionOn;
    stopTagMotion();
    clearTagDrawHighlight();
    createTagLayout();
    renderTagBoard();
    if (shouldKeepMoving) startTagMotion();
}

function startTagMotion() {
    if (tagMotionOn || getDrawableItems().length === 0) return;
    tagInertiaOn = false;
    tagInertiaStart = 0;
    if (tagMotionFrame) cancelAnimationFrame(tagMotionFrame);
    tagMotionOn = true;
    document.body.classList.add('tag-motion-on');
    const pauseBtn = document.getElementById('pauseTagsBtn');
    if (pauseBtn) pauseBtn.textContent = '暂停';
    lastMotionTime = 0;
    tagMotionFrame = requestAnimationFrame(stepTagMotion);
}

function stopTagMotion(withInertia = false) {
    tagMotionOn = false;
    document.body.classList.remove('tag-motion-on');
    const pauseBtn = document.getElementById('pauseTagsBtn');
    if (pauseBtn) pauseBtn.textContent = '让标签动起来！';
    if (tagMotionFrame) cancelAnimationFrame(tagMotionFrame);
    tagMotionFrame = null;

    if (withInertia && items.length > 0) {
        tagInertiaOn = true;
        tagInertiaStart = 0;
        lastMotionTime = 0;
        tagMotionFrame = requestAnimationFrame(stepTagInertia);
        return;
    }

    tagInertiaOn = false;
    tagInertiaStart = 0;
    lastMotionTime = 0;
}

function toggleTagPause() {
    if (tagMotionOn) {
        stopTagMotion(true);
    } else {
        startTagMotion();
    }
}

function moveTagLayout(dt, speedScale = 1) {
    tagLayout.forEach(layout => {
        if (!isCategoryDrawEnabled(getItemCategory(items[layout.index] || ''))) return;
        layout.left += layout.vx * dt * tagMotionSpeed * speedScale / 10;
        layout.top += layout.vy * dt * tagMotionSpeed * speedScale / 10;

        if (layout.left <= 2) {
            layout.left = 2;
            layout.vx = Math.abs(layout.vx);
        } else if (layout.left >= 86) {
            layout.left = 86;
            layout.vx = -Math.abs(layout.vx);
        }

        if (layout.top <= 4) {
            layout.top = 4;
            layout.vy = Math.abs(layout.vy);
        } else if (layout.top >= 84) {
            layout.top = 84;
            layout.vy = -Math.abs(layout.vy);
        }
    });
}

function stepTagMotion(timestamp) {
    if (!tagMotionOn) return;
    if (!lastMotionTime) lastMotionTime = timestamp;
    const dt = Math.min((timestamp - lastMotionTime) / 1000, 0.04);
    lastMotionTime = timestamp;

    moveTagLayout(dt);
    applyTagLayout();
    tagMotionFrame = requestAnimationFrame(stepTagMotion);
}

function stepTagInertia(timestamp) {
    if (!tagInertiaOn) return;
    if (!tagInertiaStart) tagInertiaStart = timestamp;
    if (!lastMotionTime) lastMotionTime = timestamp;

    const elapsed = timestamp - tagInertiaStart;
    const progress = Math.min(elapsed / 720, 1);
    const easing = Math.pow(1 - progress, 2);
    const dt = Math.min((timestamp - lastMotionTime) / 1000, 0.04);
    lastMotionTime = timestamp;

    moveTagLayout(dt, easing);
    applyTagLayout();

    if (progress < 1) {
        tagMotionFrame = requestAnimationFrame(stepTagInertia);
        return;
    }

    tagInertiaOn = false;
    tagInertiaStart = 0;
    lastMotionTime = 0;
    tagMotionFrame = null;
}

function clearTagDrawHighlight() {
    document.querySelectorAll('.mystery-tag.draw-flash, .mystery-tag.draw-winner')
        .forEach(tag => tag.classList.remove('draw-flash', 'draw-winner'));
}

function drawRandomTag() {
    const drawableItems = getDrawableItems();
    if (tagDrawRunning) return;
    if (drawableItems.length === 0) {
        const overlay = document.getElementById('tagRevealOverlay');
        const card = document.getElementById('tagRevealCard');
        hideTagReveal();
        card.textContent = '⚠️ 列表为空';
        card.style.setProperty('--tag-hue', 42);
        card.style.transform = '';
        overlay.classList.add('show');
        return;
    }
    hideTagReveal();
    clearTagDrawHighlight();
    tagDrawRunning = true;
    const drawBtn = document.getElementById('drawTagBtn');
    drawBtn.disabled = true;
    drawBtn.textContent = '抽取中…';

    const totalRolls = 14 + Math.floor(Math.random() * 8);
    let roll = 0;
    let lastIndex = -1;

    function flashNext() {
        clearTagDrawHighlight();
        let picked;
        do {
            picked = weightedDrawablePick();
            if (!picked) { picked = drawableItems[0]; break; }
        } while (picked.index === lastIndex && drawableItems.length > 1);
        lastIndex = picked.index;

        const tag = document.querySelector(`.mystery-tag[data-index="${lastIndex}"]`);
        if (tag) tag.classList.add('draw-flash');

        roll++;
        if (roll >= totalRolls) {
            clearTagDrawHighlight();
            const winner = document.querySelector(`.mystery-tag[data-index="${lastIndex}"]`);
            if (winner) winner.classList.add('draw-winner');
            tagDrawRunning = false;
            drawBtn.disabled = false;
            drawBtn.textContent = '随机抽取';
            setTimeout(() => revealTag(lastIndex, true), 280);
            return;
        }

        const progress = roll / totalRolls;
        const delay = 45 + progress * 130;
        setTimeout(flashNext, delay);
    }

    flashNext();
}

function revealTag(index, shouldRecord = false) {
    if (!isCategoryDrawEnabled(getItemCategory(items[index] || ''))) return;
    const overlay = document.getElementById('tagRevealOverlay');
    const card = document.getElementById('tagRevealCard');
    const layout = tagLayout.find(item => item.index === index);
    clearTagDrawHighlight();
    document.querySelectorAll('.mystery-tag.revealing').forEach(tag => tag.classList.remove('revealing'));
    const sourceTag = document.querySelector(`.mystery-tag[data-index="${index}"]`);

    function showCard() {
        card.textContent = items[index] || '';
        card.style.setProperty('--tag-hue', layout ? layout.hue : 220);
        card.style.transform = layout ? `rotate(${layout.rotate}deg)` : '';
        overlay.classList.remove('dimming');
        overlay.classList.add('show');
        if (shouldRecord) { newItemsUntilNextDraw.clear(); addDrawHistory(items[index] || ''); incrementPickCount(items[index] || ''); }
    }

    if (!sourceTag) {
        showCard();
        return;
    }

    sourceTag.classList.add('revealing');
    overlay.classList.add('dimming');
    const rect = sourceTag.getBoundingClientRect();
    const clone = document.createElement('button');
    clone.className = 'tag-fly-clone';
    clone.textContent = '?';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.setProperty('--tag-hue', layout ? layout.hue : 220);
    clone.style.transform = layout ? `rotate(${layout.rotate}deg)` : '';
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
        clone.classList.add('to-center');
        clone.style.left = '50%';
        clone.style.top = '50%';
        clone.style.transform = layout ? `translate(-50%, -50%) rotate(${layout.rotate}deg) scale(1.35)` : 'translate(-50%, -50%) scale(1.35)';
    });

    setTimeout(() => {
        clone.remove();
        showCard();
    }, 260);
}

function hideTagReveal() {
    const overlay = document.getElementById('tagRevealOverlay');
    const card = document.getElementById('tagRevealCard');
    overlay.classList.remove('show', 'dimming');
    card.style.transform = '';
    document.querySelectorAll('.mystery-tag.revealing').forEach(tag => tag.classList.remove('revealing'));
}

function showExportReminder() {
    if (undoImportState) return;
    const reminder = document.getElementById('exportReminder');
    if (!reminder) return;
    reminder.classList.add('show');
    clearTimeout(exportReminderTimer);
    exportReminderTimer = setTimeout(() => reminder.classList.remove('show'), 2600);
}

function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
}

function updateExportStatus() {
    const status = document.getElementById('exportStatus');
    if (!status) return;
    status.textContent = hasUnsavedExport ? '未保存' : '已保存';
    status.classList.toggle('dirty', hasUnsavedExport);
    status.classList.toggle('clean', !hasUnsavedExport);
}

function markListChanged() {
    hasUnsavedExport = true;
    updateExportStatus();
    showExportReminder();
}

function markListExported() {
    hasUnsavedExport = false;
    updateExportStatus();
    const reminder = document.getElementById('exportReminder');
    if (reminder) reminder.classList.remove('show');
}

function showImportUndoPrompt() {
    document.getElementById('exportReminder')?.classList.remove('show');
    document.getElementById('importUndoPrompt')?.classList.add('show');
}

function hideImportUndoPrompt() {
    document.getElementById('importUndoPrompt')?.classList.remove('show');
}

function clearUndoImportState() {
    undoImportState = null;
    hideImportUndoPrompt();
}

function createImportUndoSnapshot() {
    return {
        items: [...items],
        categoryOrder: [...categoryOrder],
        collapsedCategories: [...collapsedCategories],
        uncheckedCategories: [...uncheckedCategories],
        hasUnsavedExport,
        listSearchQuery,
        newItemsUntilNextDraw: [...newItemsUntilNextDraw]
    };
}

function undoImport() {
    if (!undoImportState) return;
    items = [...undoImportState.items];
    categoryOrder = [...undoImportState.categoryOrder];
    collapsedCategories = [...undoImportState.collapsedCategories];
    uncheckedCategories = [...undoImportState.uncheckedCategories];
    hasUnsavedExport = undoImportState.hasUnsavedExport;
    listSearchQuery = undoImportState.listSearchQuery;
    newItemsUntilNextDraw = new Set(undoImportState.newItemsUntilNextDraw || []);
    undoImportState = null;
    document.getElementById('listSearchInput').value = listSearchQuery;
    hideImportUndoPrompt();
    updateExportStatus();
    tagLayout = [];
    render();
    if (currentMode === 'tags') renderTagBoard();
}

function createExportBlob() {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items,
        categoryOrder
    };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

function downloadExportFile(filename) {
    const url = URL.createObjectURL(createExportBlob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportListFile() {
    downloadExportFile('what-to-eat-list.json');
    markListExported();
}

function backupBeforeImport() {
    // 导入前的旧列表只暂存在浏览器内，用于抽取前撤回；不再自动下载备份文件。
}

function parseImportData(text) {
    const trimmed = text.trim();

    // 新格式：每行一个项目（不以 { 开头）
    if (!trimmed.startsWith('{')) {
        const importedItems = trimmed.split('\n').map(line => line.trim()).filter(Boolean);
        if (importedItems.length === 0) throw new Error('导入的列表为空');
        const seen = {};
        const importedOrder = [];
        importedItems.forEach(item => {
            const cat = getItemCategory(item);
            if (!seen[cat]) { seen[cat] = true; importedOrder.push(cat); }
        });
        return { items: importedItems, categoryOrder: importedOrder };
    }

    // 旧 JSON 格式（兼容）
    const parsed = JSON.parse(text);
    const rawItems = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(rawItems)) throw new Error('导入文件里没有待抽列表');

    const importedItems = rawItems
        .filter(item => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean);
    if (importedItems.length === 0) throw new Error('导入文件里的列表为空');

    const rawOrder = Array.isArray(parsed?.categoryOrder) ? parsed.categoryOrder : [];
    const importedOrder = rawOrder.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean);
    return { items: importedItems, categoryOrder: importedOrder };
}

function getImportSummary(importData) {
    const seenCurrent = new Set(items.map(item => item.trim().toLowerCase()));
    const seenImport = new Set();
    const newItems = [];
    let duplicateCount = 0;

    importData.items.forEach(item => {
        const key = item.trim().toLowerCase();
        if (seenCurrent.has(key) || seenImport.has(key)) {
            duplicateCount++;
            return;
        }
        seenImport.add(key);
        newItems.push(item);
    });

    const newCategories = [...new Set(newItems.map(getItemCategory))];
    return {
        total: importData.items.length,
        newItems,
        newCount: newItems.length,
        duplicateCount,
        newCategories,
        categoryCount: newCategories.length
    };
}

function formatImportDialogHtml(summary) {
    const categoryText = summary.categoryCount > 0 ? summary.newCategories.join('、') : '无新增类别';
    return `将导入 <strong>${summary.total} 项</strong>。<br>` +
        `合并导入预计新增 <strong>${summary.newCount} 项</strong>，跳过重复 <strong>${summary.duplicateCount} 项</strong>，涉及 <strong>${summary.categoryCount} 个类别</strong>。<br>` +
        `<span class="import-preview-categories">${escapeHtml(categoryText)}</span><br>` +
        '请选择导入方式。';
}

function openImportDialog(importData) {
    pendingImportData = importData;
    resetImportDialogActions();
    document.getElementById('importDialogText').innerHTML = formatImportDialogHtml(getImportSummary(importData));
    document.getElementById('importDialogOverlay').classList.add('show');
}

function formatImportResultToast(summary, mode) {
    if (mode === 'overwrite') return `覆盖导入完成：共 ${summary.total} 项`;
    if (summary.newCount === 0) return `没有新增项目，已跳过重复 ${summary.duplicateCount} 项`;
    return `导入完成：新增 ${summary.newCount} 项，跳过重复 ${summary.duplicateCount} 项，涉及 ${summary.categoryCount} 个类别`;
}

function openImportFile() {
    const input = document.getElementById('importFileInput');
    input.value = '';
    input.click();
}

function resetImportDialogActions() {
    const mergeBtn = document.getElementById('mergeImportBtn');
    if (mergeBtn) mergeBtn.disabled = false;
    mergeBtn?.classList.remove('teaching-highlight');
    document.getElementById('overwriteImportBtn')?.classList.remove('teaching-highlight');
}

function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            openImportDialog(parseImportData(String(reader.result || '')));
        } catch (err) {
            alert(err.message || '导入失败，请检查文件格式');
        }
    };
    reader.readAsText(file, 'utf-8');
}

function mergeCategoryOrder(importedOrder) {
    const current = buildGroups().map(group => group.category);
    const merged = [...categoryOrder.filter(category => current.includes(category))];
    importedOrder.forEach(category => {
        if (!merged.includes(category)) merged.push(category);
    });
    current.forEach(category => {
        if (!merged.includes(category)) merged.push(category);
    });
    categoryOrder = merged;
    saveCategoryOrder(categoryOrder);
}

function applyImport(mode) {
    if (!pendingImportData) return;
    const isTeachingMockImport = pendingImportData.teachingMock === true;
    const summary = getImportSummary(pendingImportData);
    undoImportState = createImportUndoSnapshot();
    backupBeforeImport();

    if (mode === 'overwrite') {
        items = [...pendingImportData.items];
        categoryOrder = [...pendingImportData.categoryOrder];
        newItemsUntilNextDraw = new Set();
    } else {
        const updatedCategories = new Set();
        const updatedItems = new Set();
        const seen = new Set(items.map(item => item.trim().toLowerCase()));
        pendingImportData.items.forEach(item => {
            const key = item.trim().toLowerCase();
            if (!seen.has(key)) {
                items.push(item);
                seen.add(key);
                updatedCategories.add(getItemCategory(item));
                updatedItems.add(item);
            }
        });
        mergeCategoryOrder(pendingImportData.categoryOrder);
        categoriesToHighlight = updatedCategories;
        itemsToHighlight = updatedItems;
        newItemsUntilNextDraw = new Set(updatedItems);
    }

    sortItems(false);
    saveItems(items);
    cleanupCollapsedCategories(buildGroups().map(group => group.category));
    pendingImportData = null;
    tagLayout = [];
    document.getElementById('importDialogOverlay').classList.remove('show');
    render();
    if (currentMode === 'tags') renderTagBoard();
    markListChanged();
    showImportUndoPrompt();
    showToast(formatImportResultToast(summary, mode));
    if (isTeachingMockImport && document.body.classList.contains('teaching-mode') && teachingStep === 7) {
        completeTeachingMockImport();
    }
}

function cancelImport() {
    pendingImportData = null;
    document.getElementById('importDialogOverlay').classList.remove('show');
    resetImportDialogActions();
}

// ---------- 分享码 ----------

function toBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

function fromBase64(base64) {
    var bin = atob(base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

function encodeShareCode(plainText) {
    return 'WTE:' + toBase64(plainText);
}

function decodeShareCode(code) {
    var trimmed = (code || '').trim();
    if (trimmed.slice(0, 4).toUpperCase() !== 'WTE:') {
        throw new Error('分享码格式不正确');
    }
    try {
        return fromBase64(trimmed.slice(4));
    } catch (e) {
        throw new Error('分享码解析失败，请检查是否完整复制');
    }
}

function openShareCodeView() {
    var code = encodeShareCode(items.join('\n'));
    var textarea = document.getElementById('shareCodeViewTextarea');
    textarea.value = code;
    document.getElementById('shareCodeViewOverlay').classList.add('show');
    textarea.select();
    try {
        navigator.clipboard.writeText(code).then(function () {
            showToast('已复制到剪贴板');
        }).catch(function () {});
    } catch (e) {}
    markListExported();
}

function copyShareCode() {
    var textarea = document.getElementById('shareCodeViewTextarea');
    textarea.select();
    try {
        navigator.clipboard.writeText(textarea.value).then(function () {
            showToast('已复制到剪贴板');
        }).catch(function () { showToast('复制失败，请手动全选复制'); });
    } catch (e) { showToast('复制失败，请手动全选复制'); }
}

function closeShareCodeView() {
    document.getElementById('shareCodeViewOverlay').classList.remove('show');
}

function openShareCodeImport() {
    document.getElementById('shareCodeImportTextarea').value = '';
    document.getElementById('shareCodeImportError').classList.remove('show');
    document.getElementById('shareCodeImportOverlay').classList.add('show');
    setTimeout(function () {
        document.getElementById('shareCodeImportTextarea').focus();
    }, 150);
}

function closeShareCodeImport() {
    document.getElementById('shareCodeImportOverlay').classList.remove('show');
}

function handleShareCodeImport() {
    var errorEl = document.getElementById('shareCodeImportError');
    var raw = document.getElementById('shareCodeImportTextarea').value;
    errorEl.classList.remove('show');
    try {
        var decoded = decodeShareCode(raw);
        closeShareCodeImport();
        openImportDialog(parseImportData(decoded));
    } catch (err) {
        errorEl.textContent = err.message || '导入失败';
        errorEl.classList.add('show');
    }
}

// ---------- 分享码结束 ----------

function getAllCategories() {
    return buildGroups().map(group => group.category);
}

function areAllCategoriesExpanded() {
    const categories = getAllCategories();
    if (categories.length === 0) return true;
    if (currentMode === 'tags') {
        return categories.every(category => tagExpandedCategories.includes(category));
    }
    return categories.every(category => !collapsedCategories.includes(category));
}

function updateExpandAllButton() {
    const btn = document.getElementById('expandAllBtn');
    if (!btn) return;
    const allExpanded = areAllCategoriesExpanded();
    btn.textContent = allExpanded ? '全收起' : '全展开';
    btn.title = allExpanded ? '全部收起' : '全部展开';
    updateDrawScopeAllButton();
}

function collapseCategoriesWithAnimation(categories, afterCollapse) {
    const rows = categories.flatMap(category =>
        [...document.querySelectorAll(`li.item-row[data-category="${CSS.escape(category)}"]`)]
    );
    if (rows.length === 0) {
        afterCollapse();
        return;
    }
    rows.forEach(row => row.classList.add('collapsing'));
    setTimeout(afterCollapse, 160);
}

function toggleAllCategories() {
    const categories = getAllCategories();
    const allExpanded = areAllCategoriesExpanded();

    if (currentMode === 'tags') {
        if (allExpanded) {
            collapseCategoriesWithAnimation(categories, () => {
                tagExpandedCategories = [];
                render();
            });
        } else {
            tagExpandedCategories = categories;
            render();
        }
    } else if (allExpanded) {
        collapseCategoriesWithAnimation(categories, () => {
            collapsedCategories = categories;
            saveCollapsedCategories(collapsedCategories);
            render();
        });
    } else {
        collapsedCategories = [];
        saveCollapsedCategories(collapsedCategories);
        render();
    }
}

// 渲染列表
function renameCategory(oldCategory) {
    if (!oldCategory) return;
    const raw = prompt(`将分类“${oldCategory}”重命名为：`, oldCategory === UNCATEGORIZED ? '' : oldCategory);
    if (raw === null) return;
    const nextCategory = normalizeCategory(raw.trim());
    if (!nextCategory || nextCategory.length !== 2) {
        alert('分类名称必须是两个汉字');
        return;
    }
    if (nextCategory === oldCategory) return;

    items = items.map(item => {
        if (getItemCategory(item) !== oldCategory) return item;
        const name = getItemNameInCategory(item, oldCategory);
        return buildItemValue(nextCategory, name);
    });

    categoryOrder = categoryOrder.map(category => category === oldCategory ? nextCategory : category);
    collapsedCategories = collapsedCategories.map(category => category === oldCategory ? nextCategory : category);
    uncheckedCategories = uncheckedCategories.map(category => category === oldCategory ? nextCategory : category);
    categoryOrder = [...new Set(categoryOrder)];
    collapsedCategories = [...new Set(collapsedCategories)];
    uncheckedCategories = [...new Set(uncheckedCategories)];
    sortItems(false);
    saveItems(items);
    saveCategoryOrder(categoryOrder);
    saveCollapsedCategories(collapsedCategories);
    saveUncheckedCategories(uncheckedCategories);
    tagLayout = [];
    render();
    if (currentMode === 'tags') renderTagBoard();
    markListChanged();
}

function render() {
    const list = document.getElementById('list');
    const count = document.getElementById('count');
    const skipListAnimation = suppressNextListAnimation;
    const animateCategories = new Set(categoriesToAnimate);
    const highlightCategories = new Set(categoriesToHighlight);
    const highlightItems = new Set(itemsToHighlight);
    categoriesToAnimate.clear();
    categoriesToHighlight.clear();
    itemsToHighlight.clear();
    suppressNextListAnimation = false;
    count.textContent = `共 ${items.length} 项`;

    if (items.length === 0) {
        list.innerHTML = '<div class=”empty”><strong>还没有项目</strong><span>先添加几个选项，或点击”导入JSON”使用别人分享的列表。</span></div>';
        updateExpandAllButton();
        return;
    }

    let groups = buildGroups();
    if (listSearchQuery) {
        groups = groups
            .map(group => ({
                ...group,
                items: group.items.filter(({ item }) => item.toLowerCase().includes(listSearchQuery))
            }))
            .filter(group => group.items.length > 0);
    }

    if (groups.length === 0) {
        list.innerHTML = '<div class="empty"><strong>没有搜索结果</strong><span>换个关键词试试。</span></div>';
        updateExpandAllButton();
        return;
    }

    list.innerHTML = groups.map(group => {
        const collapsed = isCategoryCollapsed(group.category);
        const drawEnabled = isCategoryDrawEnabled(group.category);
        return `
<li class="category${collapsed ? ' collapsed' : ''}${drawEnabled ? '' : ' draw-disabled'}${highlightCategories.has(group.category) ? ' import-highlight' : ''}" draggable="true" data-category="${escapeAttribute(group.category)}">
  <span class="drag-handle" title="拖动调整分类顺序">⠿</span>
  <span class="category-arrow">${collapsed ? '▶' : '▼'}</span>
  <span class="category-title">${escapeHtml(group.category)}<span class="pick-count">${getCategoryPickTotal(group.items) > 0 ? ` 抽中${getCategoryPickTotal(group.items)}次` : ''}</span></span>
  <label class="category-draw-scope" title="是否纳入抽取范围">
    <input class="category-draw-checkbox" type="checkbox" data-category="${escapeAttribute(group.category)}" ${drawEnabled ? 'checked' : ''}>
    <span>抽取</span>
  </label>
  ${currentMode === 'tags' ? '' : `<button class="rename-category-btn" data-category="${escapeAttribute(group.category)}" title="重命名分类">改名</button>`}
  <span class="category-count">${group.items.length} 项</span>
</li>
${collapsed ? '' : group.items.map(({ item, index }) => {
        const skipItemAnimation = skipListAnimation || !animateCategories.has(group.category);
        return `
<li class="item-row${skipItemAnimation ? ' no-enter-animation' : ''}${drawEnabled ? '' : ' draw-disabled'}${highlightItems.has(item) ? ' import-highlight' : ''}" draggable="true" data-index="${index}" data-category="${escapeAttribute(group.category)}">
  <span class="drag-handle item-drag-handle" title="拖动调整项目顺序">⠿</span>
  <span class="item-text">${escapeHtml(item)}<span class="pick-count">${formatPickCount(item)}</span></span>
	  ${currentMode === 'tags' ? '' : `<button class="item-more-btn" data-index="${index}" title="更多操作">⋯</button>`}
</li>
      `; }).join('')}
      `;
    }).join('');

    // 绑定分类展开/收起事件
    list.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', function (e) {
            if (e.target.closest('.category-draw-scope')) return;
            if (this.classList.contains('drag-click-skip')) {
                this.classList.remove('drag-click-skip');
                return;
            }
            toggleCategory(this.dataset.category);
        });
    });

    // 绑定抽取范围勾选事件
    list.querySelectorAll('.category-draw-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        checkbox.addEventListener('change', function (e) {
            e.stopPropagation();
            toggleCategoryDrawEnabled(this.dataset.category);
        });
    });

    // 绑定分类重命名事件
    list.querySelectorAll('.rename-category-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            renameCategory(this.dataset.category);
        });
    });

    // 绑定更多操作事件
    list.querySelectorAll('.item-more-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var idx = parseInt(this.dataset.index);
            if (itemPopoverIndex === idx) { closeItemPopover(); return; }
            openItemPopover(idx, this);
        });
    });

    updateExpandAllButton();
}

function getCategoryPickTotal(categoryItems) {
    return categoryItems.reduce((sum, { item }) => sum + (pickCounts[item] || 0), 0);
}

function formatPickCount(item) {
    if (newItemsUntilNextDraw.has(item)) return '<span class="new-item-mark"> 新增</span>';
    var parts = [];
    var pickCount = pickCounts[item] || 0;
    var eatenCount = eatenCounts[item] || 0;
    if (pickCount > 0) parts.push('抽中' + pickCount + '次');
    if (eatenCount > 0) parts.push('吃过' + eatenCount + '次');
    return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttribute(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function getItemNameInCategory(item, category) {
    if (category === UNCATEGORIZED) return item;
    const prefix = category + ' ';
    return item.startsWith(prefix) ? item.slice(prefix.length) : item;
}

function openBulkEditPicker() {
    alert('选择类别以批量更改');
    const groups = buildGroups();
    if (groups.length === 0) return;
    if (groups.length === 1) {
        openBulkEdit(groups[0].category);
        return;
    }
    collapsedCategories = [];
    saveCollapsedCategories(collapsedCategories);
    if (currentMode === 'tags') {
        tagExpandedCategories = groups.map(group => group.category);
        document.querySelector('.right-panel').classList.add('drawer-open');
    }
    render();
}

function openBulkEdit(category) {
    bulkEditCategory = category;
    const group = buildGroups().find(item => item.category === category);
    if (!group) return;
    document.getElementById('bulkEditTitle').textContent = `批量编辑：${category}`;
    document.getElementById('bulkEditTextarea').value = group.items
        .map(({ item }) => getItemNameInCategory(item, category))
        .join('\n');
    document.getElementById('bulkEditOverlay').classList.add('show');
    document.getElementById('bulkEditTextarea').focus();
}

function closeBulkEdit() {
    bulkEditCategory = '';
    document.getElementById('bulkEditOverlay').classList.remove('show');
}

function saveBulkEdit() {
    if (!bulkEditCategory) return;
    const lines = document.getElementById('bulkEditTextarea').value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const seenLines = new Set();
    const nextItemsForCategory = [];

    lines.forEach(line => {
        const val = bulkEditCategory === UNCATEGORIZED ? line : `${bulkEditCategory} ${line}`;
        const key = val.toLowerCase();
        if (!seenLines.has(key)) {
            seenLines.add(key);
            nextItemsForCategory.push(val);
        }
    });

    const existingOtherKeys = new Set(items
        .filter(item => getItemCategory(item) !== bulkEditCategory)
        .map(item => item.trim().toLowerCase()));
    const filteredNext = nextItemsForCategory.filter(item => !existingOtherKeys.has(item.trim().toLowerCase()));

    let inserted = false;
    const nextItems = [];
    items.forEach(item => {
        if (getItemCategory(item) === bulkEditCategory) {
            if (!inserted) {
                nextItems.push(...filteredNext);
                inserted = true;
            }
        } else {
            nextItems.push(item);
        }
    });
    if (!inserted) nextItems.push(...filteredNext);

    items = nextItems;
    sortItems(false);
    tagLayout = [];
    closeBulkEdit();
    render();
    if (currentMode === 'tags') renderTagBoard();
    markListChanged();
}

// 保留已有项目原样；新项目由“类别 + 名称”输入框决定是否带分类
function formatItemName(item) {
    return item.trim();
}

function formatAllItems() {
    sortItems(false);
}

function normalizeCategory(raw) {
    return raw.replace(/[^一-龥]/g, '').slice(0, 2);
}

function normalizeName(raw) {
    return raw.trim();
}

function buildItemValue(category, name) {
    return category ? `${category} ${name}` : name;
}

function isCategoryInputInvalid(categoryInput) {
    const raw = categoryInput.value.trim();
    if (!raw) return false;
    const normalized = normalizeCategory(raw);
    return raw !== normalized || normalized.length !== 2;
}

function setCategoryInvalidState(categoryInput, invalid, flash = false) {
    const group = categoryInput.closest('.item-input-group');
    const hint = group?.querySelector('.category-format-hint');
    const submitBtn = group?.parentElement?.querySelector('button.primary');
    group?.classList.toggle('category-format-invalid', invalid);
    categoryInput.classList.toggle('duplicate-warn', invalid && flash);
    if (submitBtn) submitBtn.disabled = invalid;
    if (flash) {
        hint?.classList.remove('category-format-flash');
        void hint?.offsetWidth;
        hint?.classList.add('category-format-flash');
        setTimeout(() => {
            categoryInput.classList.remove('duplicate-warn');
            hint?.classList.remove('category-format-flash');
        }, 1500);
    }
}

function updateCategoryValidity(categoryInput, flash = false) {
    const invalid = isCategoryInputInvalid(categoryInput);
    setCategoryInvalidState(categoryInput, invalid, flash);
    return !invalid;
}

function showCategoryFormatError(categoryInput) {
    setCategoryInvalidState(categoryInput, true, true);
}

function validateCategoryInput(categoryInput) {
    const raw = categoryInput.value.trim();
    const normalized = normalizeCategory(raw);
    if (!raw) {
        categoryInput.value = '';
        setCategoryInvalidState(categoryInput, false);
        return '';
    }
    if (raw !== normalized || normalized.length !== 2) {
        if (raw === normalized) categoryInput.value = normalized;
        showCategoryFormatError(categoryInput);
        categoryInput.focus();
        return null;
    }
    categoryInput.value = normalized;
    setCategoryInvalidState(categoryInput, false);
    return normalized;
}

function addValueToItems(categoryInput, nameInput) {
    const category = validateCategoryInput(categoryInput);
    if (category === null) return false;
    const name = normalizeName(nameInput.value);
    categoryInput.value = category;
    nameInput.value = nameInput.value.replace(/^\s+/, '');
    if (!name) return false;

    const val = buildItemValue(category, name);

    // 防重复检查
    if (isDuplicateItem(val)) {
        warnDuplicate(nameInput);
        return false;
    }

    insertItemByTime(val);
    sortItems(false);
    tagLayout = [];
    categoryInput.value = '';
    nameInput.value = '';
    categoryInput.focus();
    categoriesToAnimate.add(getItemCategory(val));
    render();
    if (document.body.classList.contains('teaching-mode')) {
        setTeachingStep(teachingStep);
    }
    if (currentMode === 'tags') renderTagBoard();
    markListChanged();
    return true;
}

// 添加（含防重复）
function addItem() {
    addValueToItems(document.getElementById('categoryInput'), document.getElementById('itemInput'));
}

// 按分类顺序重排，保留类内手动顺序
function sortItems(shouldRender = true) {
    const groups = buildGroups();
    syncCategoryOrder(groups);
    items = flattenGroups(groups);
    saveItems(items);
    if (shouldRender) render();
}

// 简单防重复：忽略大小写，并去掉首尾空格
function isDuplicateItem(val, ignoreIndex = -1) {
    const normalized = val.trim().toLowerCase();
    return items.some((item, i) => i !== ignoreIndex && item.trim().toLowerCase() === normalized);
}

function warnDuplicate(input) {
    input.classList.add('duplicate-warn');
    const oldPlaceholder = input.placeholder;
    input.placeholder = '该项已存在，请勿重复添加';
    input.value = '';
    setTimeout(() => {
        input.classList.remove('duplicate-warn');
        input.placeholder = oldPlaceholder || '输入待抽项目，回车添加';
    }, 1500);
    input.focus();
}

function splitItemForEdit(item) {
    const category = getItemCategory(item);
    return {
        category: category === UNCATEGORIZED ? '' : category,
        name: getItemNameInCategory(item, category)
    };
}

function saveEdit(index) {
    const row = document.querySelector(`li.item-row[data-index="${index}"]`);
    if (!row) return;
    const categoryInput = row.querySelector('.category-input');
    const nameInput = row.querySelector('.name-input');
    if (!categoryInput || !nameInput) return;

    const category = validateCategoryInput(categoryInput);
    if (category === null) return;
    const name = normalizeName(nameInput.value);
    nameInput.value = nameInput.value.replace(/^\s+/, '');
    if (!name) return;

    const val = buildItemValue(category, name);
    if (isDuplicateItem(val, index)) {
        warnDuplicate(nameInput);
        return;
    }

    items.splice(index, 1);
    insertItemByTime(val);
    sortItems(false);
    tagLayout = [];
    suppressNextListAnimation = true;
    render();
    if (document.body.classList.contains('teaching-mode')) {
        setTeachingStep(teachingStep);
    }
    markListChanged();
}

function cancelInlineEdit() {
    if (!document.querySelector('li.item-row.editing')) return;
    suppressNextListAnimation = true;
    render();
}

// 进入列表内编辑
function startEdit(index) {
    ignoreNextEditOutsideClick = true;
    suppressNextListAnimation = true;
    render();
    const li = document.querySelector(`li.item-row[data-index="${index}"]`);
    if (!li) return;
    const parts = splitItemForEdit(items[index]);
    li.classList.add('editing');
    li.innerHTML = `
  <span class="drag-handle item-drag-handle">⠿</span>
  <div class="item-input-group item-edit-group">
    <input class="category-input" type="text" placeholder="空则无类别" value="${escapeAttribute(parts.category)}">
    <span class="input-separator"></span>
    <input class="name-input" type="text" placeholder="名称，回车保存" value="${escapeAttribute(parts.name)}">
  </div>
  <button class="save" data-index="${index}" title="保存">✓</button>
  <button class="cancel" title="取消">↩</button>
`;
    const categoryInput = li.querySelector('.category-input');
    const nameInput = li.querySelector('.name-input');
    setupCategoryNameNavigation(categoryInput, nameInput);
    categoryInput.addEventListener('blur', function () {
        validateCategoryInput(this);
    });
    categoryInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameInput.focus();
        }
        if (e.key === 'Escape') cancelInlineEdit();
    });
    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/^\s+/, '');
    });
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') saveEdit(index);
        if (e.key === 'Escape') cancelInlineEdit();
    });
    nameInput.focus();
    const saveBtn = li.querySelector('.save');
    const cancelBtn = li.querySelector('.cancel');
    saveBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        saveEdit(index);
    });
    cancelBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        cancelInlineEdit();
    });
    updateCategoryValidity(categoryInput);
}

// 抽取（5~10 次快速随机切换，候选框只显示最终结果）
function pick() {
    const resultEl = document.getElementById('result');
    const pickBtn = document.getElementById('pickBtn');

    const drawableItems = getDrawableItems();
    if (items.length === 0 || drawableItems.length === 0) {
        resultHidden = false;
        resultEl.classList.remove('hidden-result');
        setResultText('⚠️ 列表为空');
        hideResultConfirm();
        return;
    }

    if (pickBtn.disabled) return; // 动画进行中，防连点

    if (resultHidden) {
        resultHidden = false;
        resultEl.classList.remove('hidden-result');
    }
    hideResultConfirm();

    const totalRolls = Math.max(8, Math.round(drawDurationSeconds * 8));
    const drawDurationMs = drawDurationSeconds * 1000;
    let roll = 0;
    let lastIdx = -1;

    pickBtn.disabled = true;
    pickBtn.textContent = '抽取中…';
    setResultBlur(0);

    // 清除上次高亮
    document.querySelectorAll('li.highlight').forEach(el => el.classList.remove('highlight'));

    function doRoll() {
        // 尽量不和上一轮重复，增强滚动感
        let picked;
        do {
            picked = weightedDrawablePick();
            if (!picked) { picked = drawableItems[0]; break; }
        } while (picked.index === lastIdx && drawableItems.length > 1);

        lastIdx = picked.index;
        const progress = roll / totalRolls;
        setResultBlur(progress);
        const rollDuration = 70 + progress * 170;
        setResultText('👉 ' + picked.item, true, rollDuration);

        roll++;
        if (roll >= totalRolls) {
            // 最终结果
            setResultText('🎯 ' + items[lastIdx], true, 260);
            newItemsUntilNextDraw.clear();
            addDrawHistory(items[lastIdx]);
            incrementPickCount(items[lastIdx]);
            setTimeout(clearResultBlur, 120);
            const category = getItemCategory(items[lastIdx]);
            if (!isCategoryCollapsed(category)) {
                const li = document.querySelector(`li.item-row[data-index="${lastIdx}"]`);
                if (li) {
                    li.classList.add('highlight');
                    li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else {
                const catLi = document.querySelector(`li.category[data-category="${CSS.escape(category)}"]`);
                if (catLi) {
                    catLi.classList.add('highlight');
                    catLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
            pickBtn.disabled = false;
            pickBtn.textContent = '抽一个';
            showResultConfirm();
            if (document.body.classList.contains('teaching-mode') && teachingStep === 5) {
                teachingPickDone = true;
                updateTeachingNextState();
            }
            return;
        }

        const delayProgress = roll / totalRolls;
        const averageDelay = drawDurationMs / Math.max(1, totalRolls - 1);
        const delay = Math.max(35, averageDelay * (0.45 + delayProgress * 1.1));
        setTimeout(doRoll, delay);
    }

    doRoll();
}

function clearTeachingHighlights() {
    document.querySelectorAll('.teaching-highlight').forEach(el => el.classList.remove('teaching-highlight'));
}

function updateTeachingInputLock() {
    const categoryInput = document.getElementById('categoryInput');
    const nameInput = document.getElementById('itemInput');
    const addBtn = document.getElementById('addBtn');
    const pickBtn = document.getElementById('pickBtn');
    if (!document.body.classList.contains('teaching-mode')) {
        categoryInput.disabled = false;
        nameInput.disabled = false;
        if (addBtn) addBtn.disabled = isCategoryInputInvalid(categoryInput);
        if (pickBtn) pickBtn.disabled = false;
        const toggleResultBtn = document.getElementById('toggleResultBtn');
        if (toggleResultBtn && toggleResultBtn.style.display !== 'none') toggleResultBtn.disabled = false;
        return;
    }

    const editableCurrentStep = teachingStep === teachingLatestStep;
    categoryInput.disabled = !(editableCurrentStep && teachingStep === 1);
    nameInput.disabled = !(editableCurrentStep && (teachingStep === 2 || teachingStep === 3) && !isTeachingStepComplete());
    if (addBtn) addBtn.disabled = !(editableCurrentStep && teachingStep === 3 && !isTeachingStepComplete());
    if (pickBtn) pickBtn.disabled = !(editableCurrentStep && teachingStep === 5 && !isTeachingStepComplete());
    const toggleResultBtn = document.getElementById('toggleResultBtn');
    if (toggleResultBtn && toggleResultBtn.style.display !== 'none') {
        toggleResultBtn.disabled = teachingStep !== 6;
    }
}

function isTeachingStepComplete() {
    const categoryInput = document.getElementById('categoryInput');
    const nameInput = document.getElementById('itemInput');
    if (teachingStep === 0) return true;
    if (teachingStep === 1) return categoryInput?.value.trim() === '一食';
    if (teachingStep === 2) return nameInput?.value.trim() === '兰州拉面';
    if (teachingStep === 3) return items.includes('一食 兰州拉面');
    if (teachingStep === 4) return teachingStep4Released;
    if (teachingStep === 5) return teachingPickDone;
    if (teachingStep === 6) return teachingConfirmDone;
    if (teachingStep === 7) return teachingMockImportDone;
    if (teachingStep === 8) return true;
    if (teachingStep === 9) return true;
    if (teachingStep === 10) return true;
    if (teachingStep === 11) return true;
    if (teachingStep === 12) return true;
    if (teachingStep === 13) return true;
    if (teachingStep === 14) return true;
    if (teachingStep === 15) return true;
    if (teachingStep === 16) return true;
    return true;
}

function updateTeachingNextState() {
    if (!document.body.classList.contains('teaching-mode')) return;
    const nextBtn = document.getElementById('teachingNextBtn');
    const prevBtn = document.getElementById('teachingPrevBtn');
    if (nextBtn) {
        nextBtn.disabled = teachingStep === teachingLatestStep && !isTeachingStepComplete();
    }
    if (prevBtn) prevBtn.disabled = teachingStep <= 0;
    updateTeachingInputLock();
}

function addTeachingDemoItems() {
    const demoItems = ['一食 沙县小吃', '二食 麻辣香锅', '瑞幸咖啡'];
    demoItems.forEach(item => {
        if (!items.some(existing => existing.trim().toLowerCase() === item.toLowerCase())) {
            insertItemByTime(item);
        }
    });
    sortItems(false);
    render();
}

function findItemRowByName(name) {
    const index = items.indexOf(name);
    return index >= 0 ? document.querySelector(`li.item-row[data-index="${index}"]`) : null;
}

function openTeachingEditExample() {
    const index = items.indexOf('一食 牛肉面') >= 0 ? items.indexOf('一食 牛肉面') : items.indexOf('一食 兰州拉面');
    if (index < 0) return;
    startEdit(index);
    document.querySelector(`li.item-row[data-index="${index}"] .category-input`)?.classList.add('teaching-highlight');
}

function closeTeachingInlineEdit() {
    if (document.querySelector('li.item-row.editing')) {
        suppressNextListAnimation = true;
        render();
    }
}

function flashTeachingStepZeroCard() {
    const card = document.querySelector('.teaching-panel-card');
    if (!card) return;
    card.classList.remove('step-zero-flash');
    void card.offsetWidth;
    card.classList.add('step-zero-flash');
}

function flashTeachingReturnButton() {
    const backBtn = document.getElementById('backFromTeachingBtn');
    if (!backBtn) return;
    backBtn.classList.remove('teaching-return-flash');
    void backBtn.offsetWidth;
    backBtn.classList.add('teaching-return-flash');
}

function getTeachingMockImportData() {
    const mockItems = ['甜点 提拉米苏', '甜点 芋泥蛋糕', '夜宵 烤冷面', '饮品 蜂蜜柚子茶'];
    return {
        items: mockItems,
        categoryOrder: ['甜点', '夜宵', '饮品'],
        teachingMock: true
    };
}

function openTeachingMockImport() {
    document.getElementById('teachingMockImportOverlay')?.classList.add('show');
    document.getElementById('mockExampleFileBtn')?.classList.add('teaching-highlight');
}

function closeTeachingMockImport() {
    document.getElementById('teachingMockImportOverlay')?.classList.remove('show');
    document.getElementById('mockExampleFileBtn')?.classList.remove('teaching-highlight');
}

function applyTeachingMockImport() {
    if (!document.body.classList.contains('teaching-mode') || teachingStep !== 7) return;
    closeTeachingMockImport();
    pendingImportData = getTeachingMockImportData();
    const dialogText = document.getElementById('importDialogText');
    dialogText.innerHTML = `将导入 <strong>${pendingImportData.items.length} 项</strong>。<br><strong>合并导入</strong>：保留当前教学列表，只把文件里的新项目追加进来，适合接收别人分享的补充列表。<br><strong>覆盖导入</strong>：清空当前列表，完全换成文件里的内容，适合恢复备份。<br>这里请点击 <strong>合并导入</strong>，看看导入内容如何补充到现有列表。`;
    document.getElementById('importDialogOverlay').classList.add('show');
    const mergeBtn = document.getElementById('mergeImportBtn');
    if (mergeBtn) mergeBtn.disabled = false;
    mergeBtn?.classList.add('teaching-highlight');
}

function completeTeachingMockImport() {
    teachingMockImportDone = true;
    undoImportState = null;
    hasUnsavedExport = false;
    hideImportUndoPrompt();
    updateExportStatus();
    document.getElementById('exportReminder')?.classList.remove('show');
    resetImportDialogActions();
    document.getElementById('teachingNextBtn')?.classList.add('teaching-highlight');
    updateTeachingNextState();
}

function renderTeachingFeatureText(features) {
    return features.map((feature, index) => {
        const content = `<strong>${feature.label}</strong>：${feature.text}`;
        return index === teachingFeatureIndex ? `<span class="teaching-text-highlight">${content}</span>` : content;
    }).join('<br>');
}

function highlightTeachingFeature(featureKeys) {
    const settingsWrap = document.querySelector('.settings-wrap');
    const settingsMenu = document.getElementById('settingsMenu');
    settingsWrap?.classList.remove('open');
    settingsMenu?.classList.remove('open');
    const key = featureKeys[teachingFeatureIndex];
    if (key === 'scope') {
        document.querySelectorAll('.category-draw-scope').forEach(scope => scope.classList.add('teaching-highlight'));
        document.getElementById('drawScopeAllBtn')?.classList.add('teaching-highlight');
        return;
    }
    if (key === 'export') {
        settingsWrap?.classList.add('open');
        settingsMenu?.classList.add('open');
        document.getElementById('settingsBtn')?.classList.add('teaching-highlight');
        document.getElementById('exportBtn')?.classList.add('teaching-highlight');
        return;
    }
    if (key === 'rename') {
        document.querySelector('.rename-category-btn')?.classList.add('teaching-highlight');
        return;
    }
    const targets = {
        search: document.getElementById('listSearchInput'),
        expand: document.getElementById('expandAllBtn')
    };
    targets[key]?.classList.add('teaching-highlight');
}

function highlightTeachingCategory(category) {
    document.querySelector(`li.category[data-category="${CSS.escape(category)}"] .category-title`)?.classList.add('teaching-highlight');
}

function openSettingsMenuForTeaching(highlightId) {
    setTimeout(() => {
        const settingsWrap = document.querySelector('.settings-wrap');
        const settingsMenu = document.getElementById('settingsMenu');
        settingsWrap?.classList.add('open');
        settingsMenu?.classList.add('open');
        document.getElementById('settingsBtn')?.classList.add('teaching-highlight');
        document.getElementById(highlightId)?.classList.add('teaching-highlight');
    }, 0);
}

function setTeachingStep(step) {
    teachingStep = step;
    document.body.classList.toggle('teaching-import-step', step === 7);
    clearTeachingHighlights();
    const kicker = document.getElementById('teachingKicker');
    const title = document.getElementById('teachingTitle');
    const desc = document.getElementById('teachingDesc');
    const nextBtn = document.getElementById('teachingNextBtn');
    const categoryInput = document.getElementById('categoryInput');
    const nameInput = document.getElementById('itemInput');
    const inputGroup = categoryInput?.closest('.item-input-group');
    if (!title || !desc || !nextBtn || !kicker) return;

    if (step === 0) {
        kicker.textContent = '0';
        title.textContent = '欢迎进入教学页面';
        desc.innerHTML = '这里会用一个独立的空列表带你熟悉添加、修改、删除和导入示例。你可以随时点击左上角退出教学。点击下一步开始操作。';
        nextBtn.textContent = '下一步';
        flashTeachingStepZeroCard();
        updateTeachingNextState();
        return;
    }

    if (step === 1) {
        kicker.textContent = '1';
        title.textContent = '添加有类别的条目';
        desc.innerHTML = '先在类别框输入 <strong>一食</strong>。类别可以为空；如果填写，必须是正好两个汉字。输入完成后，点击下一步。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep && !isTeachingStepComplete()) {
            categoryInput?.classList.add('teaching-highlight');
            categoryInput?.focus();
        }
        updateTeachingNextState();
        return;
    }

    if (step === 2) {
        kicker.textContent = '2';
        title.textContent = '填写条目名称';
        desc.innerHTML = '现在在名称框输入 <strong>兰州拉面</strong>。名称是实际会参与抽取的内容。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep && !isTeachingStepComplete()) {
            nameInput?.classList.add('teaching-highlight');
            nameInput?.focus();
        }
        updateTeachingNextState();
        return;
    }

    if (step === 3) {
        kicker.textContent = '3';
        title.textContent = '添加到待抽列表';
        desc.innerHTML = '点击 <strong>添加</strong>。项目会进入右侧待抽列表，并按照 <strong>一食</strong> 自动分类。到此你已经学会了添加一个带类别的项目。';
        nextBtn.textContent = '下一步';
        if (isTeachingStepComplete()) {
            highlightTeachingCategory('一食');
        } else if (teachingStep === teachingLatestStep) {
            document.getElementById('addBtn')?.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 4) {
        kicker.textContent = '4';
        title.textContent = '看看自动分组';
        desc.innerHTML = '我会再添加 <strong>一食 沙县小吃</strong>、<strong>二食 麻辣香锅</strong> 和 <strong>瑞幸咖啡</strong>。不同类别会自动分类在不同的组内，允许<strong>不填写类别</strong>，此时项目将进入未分类组。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep && !teachingStep4Released) {
            addTeachingDemoItems();
            teachingStep4Released = false;
            clearTimeout(teachingStep4ReleaseTimer);
            teachingStep4ReleaseTimer = setTimeout(() => {
                teachingStep4Released = true;
                updateTeachingNextState();
            }, 2000);
        }
        updateTeachingNextState();
        return;
    }

    if (step === 5) {
        kicker.textContent = '5';
        title.textContent = '试着抽一个';
        desc.innerHTML = '现在点击 <strong>抽一个</strong>，系统会从待抽列表里随机选出一个项目。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep && !isTeachingStepComplete()) {
            document.getElementById('pickBtn')?.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 6) {
        kicker.textContent = '6';
        title.textContent = '确认结果';
        desc.innerHTML = '抽取结果出来后，点击 <strong>确定</strong>，结果会和按钮一起消失。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep && !isTeachingStepComplete()) {
            document.getElementById('toggleResultBtn')?.classList.add('teaching-highlight');
        } else if (isTeachingStepComplete()) {
            nextBtn.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 7) {
        closeTeachingInlineEdit();
        kicker.textContent = '7';
        title.textContent = '模拟导入分享列表';
        desc.innerHTML = '导入适合接收别人分享的待抽列表，也方便在不同设备间迁移。这里用模拟窗口演示：请先点击待抽列表右上角的 <strong>☰</strong>，菜单打开后点击金光提示的 <strong>导入JSON</strong>，随后选择 <strong>example-list.json</strong>，再按说明选择导入方式。';
        nextBtn.textContent = '下一步';
        if (!teachingMockImportDone) {
            document.getElementById('settingsBtn')?.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 8) {
        closeTeachingInlineEdit();
        openSettingsMenuForTeaching('shareCodeGenBtn');
        kicker.textContent = '8';
        title.textContent = '认识分享码';
        desc.innerHTML = '除了导出 JSON 文件，也可以生成一段分享码，复制到其他设备就能导入同样的列表。分享码是一段纯文本，方便通过聊天软件发送以及备份。';
        nextBtn.textContent = '下一步';
        updateTeachingNextState();
        return;
    }

    if (step === 9) {
        kicker.textContent = '9';
        title.textContent = '基础操作完成';
        desc.innerHTML = '至此你已经学会了所有基础操作。你可以从左上角退出教学模式，也可以继续了解更多小功能。';
        nextBtn.textContent = '下一步';
        flashTeachingReturnButton();
        updateTeachingNextState();
        return;
    }

    if (step === 10) {
        kicker.textContent = '10';
        title.textContent = '手动调整顺序';
        desc.innerHTML = '你可以拖动待抽列表里的分类或同类别条目，手动调整顺序。电脑端直接拖动；手机端可以长按分类、条目空白处或拖动手柄后再拖动。拖动时，蓝色横线会提示即将插入的位置。试试看也没关系，不操作也可以继续。';
        nextBtn.textContent = '下一步';
        document.querySelectorAll('#list .drag-handle').forEach(handle => handle.classList.add('teaching-highlight'));
        updateTeachingNextState();
        return;
    }

    if (step === 11) {
        kicker.textContent = '11';
        title.textContent = '修改一个条目';
        desc.innerHTML = '点击任意条目右侧的 \u22ef 按钮，再选择编辑，就可以修改名称或类别。你可以试着把 <strong>一食 兰州拉面</strong> 改成 <strong>一食 牛肉面</strong>，也可以直接下一步。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep) {
            findItemRowByName('一食 兰州拉面')?.querySelector('.item-more-btn')?.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 12) {
        kicker.textContent = '12';
        title.textContent = '类别也可以修改';
        desc.innerHTML = '编辑条目时，左侧类别框也可以修改。只要格式正确，保存后条目会按照新的类别自动进入对应分组。你可以试着改，也可以直接下一步。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep) {
            openTeachingEditExample();
        }
        updateTeachingNextState();
        return;
    }

    if (step === 13) {
        closeTeachingInlineEdit();
        kicker.textContent = '13';
        title.textContent = '删除一个条目';
        desc.innerHTML = '点击 <strong>瑞幸咖啡</strong> 右侧的 \u22ef 按钮，再选择删除，可以把它从待抽列表中移除。你可以试试看，也可以直接下一步。';
        nextBtn.textContent = '下一步';
        if (teachingStep === teachingLatestStep) {
            findItemRowByName('瑞幸咖啡')?.querySelector('.item-more-btn')?.classList.add('teaching-highlight');
        }
        updateTeachingNextState();
        return;
    }

    if (step === 14) {
        closeTeachingMockImport();
        const features = [
            { key: 'scope', label: '抽取范围', text: '每个分类右侧的勾选框表示是否参与抽取；取消勾选后，普通抽取不会抽到该分类，标签模式中也会变灰不可点按。右上角的 <strong>全选</strong> 可以快速全选 / 全不选。' },
            { key: 'rename', label: '类别改名', text: '分类标题右侧的 <strong>改名</strong> 可以重命名整个分类。输入仍需是两个汉字，分类内项目会一起换到新类别。' },
            { key: 'export', label: '导出备份', text: '列表整理好后，可以从右上角菜单导出JSON，之后需要迁移或备份时更安心。' }
        ];
        kicker.textContent = '14';
        title.textContent = '列表管理功能';
        desc.innerHTML = renderTeachingFeatureText(features);
        nextBtn.textContent = teachingFeatureIndex >= features.length - 1 ? '下一步' : '继续';
        highlightTeachingFeature(features.map(feature => feature.key));
        updateTeachingNextState();
        return;
    }

    if (step === 15) {
        const features = [
            { key: 'search', label: '搜索', text: '可以用搜索框过滤待抽列表，快速找到想看的项目。' },
            { key: 'expand', label: '全展开 / 全收起', text: '可以一键展开或收起所有分类，整理列表视图。' }
        ];
        kicker.textContent = '15';
        title.textContent = '视图辅助功能';
        desc.innerHTML = renderTeachingFeatureText(features);
        nextBtn.textContent = teachingFeatureIndex >= features.length - 1 ? '下一步' : '继续';
        highlightTeachingFeature(features.map(feature => feature.key));
        updateTeachingNextState();
        return;
    }

    closeTeachingInlineEdit();
    closeTeachingMockImport();
    kicker.textContent = '16';
    title.textContent = '教学完成';
    desc.innerHTML = '教学到这里就结束了。愿你以后永远不愁吃什么，打开列表就能抽到今天的答案。';
    nextBtn.textContent = '完成';
    updateTeachingNextState();
}

function ensureListOpen() {
    document.getElementById('listHeader')?.classList.remove('collapsed');
    document.getElementById('listBody')?.classList.remove('collapsed');
}

const PAGE_SWITCH_OUT_MS = 180;
const PAGE_SWITCH_IN_MS = 280;
let pageSwitching = false;

function clearPageSwitchClasses() {
    document.body.classList.remove(
        'page-switching',
        'page-to-teaching-out',
        'page-teaching-in',
        'page-to-home-out',
        'page-home-in'
    );
}

function runPageSwitch(outClass, inClass, applyChange) {
    if (pageSwitching) return;
    pageSwitching = true;
    clearPageSwitchClasses();
    document.body.classList.add('page-switching', outClass);

    setTimeout(() => {
        document.body.classList.remove(outClass);
        applyChange();
        void document.body.offsetWidth;
        document.body.classList.add(inClass);

        setTimeout(() => {
            clearPageSwitchClasses();
            pageSwitching = false;
        }, PAGE_SWITCH_IN_MS);
    }, PAGE_SWITCH_OUT_MS);
}

function transitionToTeachingMode() {
    runPageSwitch('page-to-teaching-out', 'page-teaching-in', enterTeachingMode);
}

function transitionToHomeMode() {
    runPageSwitch('page-to-home-out', 'page-home-in', exitTeachingMode);
}

function enterTeachingMode() {
    savedMainState = {
        items: [...items],
        categoryOrder: [...categoryOrder],
        collapsedCategories: [...collapsedCategories],
        uncheckedCategories: [...uncheckedCategories],
        listSearchQuery,
        hasUnsavedExport,
        newItemsUntilNextDraw: [...newItemsUntilNextDraw]
    };
    teachingItems = [];
    teachingCategoryOrder = [];
    teachingStep = 0;
    teachingLatestStep = 0;
    teachingStep4Released = false;
    teachingPickDone = false;
    teachingConfirmDone = false;
    teachingMockImportDone = false;
    teachingFeatureIndex = 0;
    items = teachingItems;
    categoryOrder = teachingCategoryOrder;
    collapsedCategories = [];
    uncheckedCategories = [];
    newItemsUntilNextDraw = new Set();
    listSearchQuery = '';
    hasUnsavedExport = false;
    updateDrawDurationDisplay();
    switchMode('normal');
    document.body.classList.add('teaching-mode');
    document.getElementById('listSearchInput').value = '';
    updateExportStatus();
    ensureListOpen();
    setTeachingStep(0);
    render();
}

function openTeachingExitDialog() {
    document.getElementById('teachingExitOverlay')?.classList.add('show');
}

function handleTeachingBack() {
    if (teachingStep === 0) {
        transitionToHomeMode();
        return;
    }
    openTeachingExitDialog();
}

function closeTeachingExitDialog() {
    document.getElementById('teachingExitOverlay')?.classList.remove('show');
}

function exitTeachingMode() {
    clearTeachingHighlights();
    document.body.classList.remove('teaching-mode');
    if (savedMainState) {
        items = savedMainState.items;
        categoryOrder = savedMainState.categoryOrder;
        collapsedCategories = savedMainState.collapsedCategories;
        uncheckedCategories = savedMainState.uncheckedCategories || [];
        listSearchQuery = savedMainState.listSearchQuery;
        hasUnsavedExport = savedMainState.hasUnsavedExport;
        newItemsUntilNextDraw = new Set(savedMainState.newItemsUntilNextDraw || []);
        savedMainState = null;
    }
    document.getElementById('listSearchInput').value = listSearchQuery;
    updateExportStatus();
    updateTeachingInputLock();
    render();
}

function moveCaretToEnd(input) {
    const end = input.value.length;
    input.focus();
    input.setSelectionRange(end, end);
}

function setupCategoryNameNavigation(categoryInput, nameInput) {
    let composing = false;

    function maybeMoveToName() {
        if (composing) return;
        if (document.body.classList.contains('teaching-mode') && teachingStep === 1) return;
        if (!isCategoryInputInvalid(categoryInput) && categoryInput.value.trim().length > 0) {
            nameInput.focus();
        }
    }

    categoryInput.addEventListener('compositionstart', function () {
        composing = true;
    });

    categoryInput.addEventListener('compositionend', function () {
        composing = false;
        updateCategoryValidity(this);
        maybeMoveToName();
        updateTeachingNextState();
    });

    categoryInput.addEventListener('input', function () {
        updateCategoryValidity(this);
        maybeMoveToName();
        updateTeachingNextState();
        var dd = document.getElementById('categoryDropdownMenu');
        if (dd) dd.remove();
    });

    nameInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Backspace') return;
        if (this.value !== '' || this.selectionStart !== 0 || this.selectionEnd !== 0) return;
        e.preventDefault();
        moveCaretToEnd(categoryInput);
    });
}

function setupSplitInput(categoryId, nameId, submitFn) {
    const categoryInput = document.getElementById(categoryId);
    const nameInput = document.getElementById(nameId);

    setupCategoryNameNavigation(categoryInput, nameInput);

    categoryInput.addEventListener('blur', function () {
        validateCategoryInput(this);
        updateTeachingNextState();
    });

    categoryInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameInput.focus();
        }
    });

    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/^\s+/, '');
        updateTeachingNextState();
    });

    nameInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (document.body.classList.contains('teaching-mode') && teachingStep !== 3) return;
        e.preventDefault();
        e.stopPropagation();
        submitFn();
    });
}

function dismissGuideAttention() {
    if (guideAttentionDismissed) return;
    guideAttentionDismissed = true;
    clearTimeout(guideTipFadeTimer);
    document.body.classList.remove('guide-attention', 'guide-tip-fading');
}

function disableGuideAttention() {
    setGuidePromptDisabled();
    dismissGuideAttention();
}

function enableGuideAttention() {
    if (isGuidePromptDisabled()) return;
    document.body.classList.remove('guide-tip-fading');
    document.body.classList.add('guide-attention');
    clearTimeout(guideTipFadeTimer);
    guideTipFadeTimer = setTimeout(() => {
        if (!guideAttentionDismissed) document.body.classList.add('guide-tip-fading');
    }, 3000);
    document.addEventListener('pointerdown', dismissGuideAttention, { once: true });
}

function enterWelcomePage() {
    const overlay = document.getElementById('welcomeOverlay');
    if (!overlay) return;
    overlay.classList.add('expand-out');
    document.body.classList.remove('welcome-active');
    document.body.classList.add('welcome-main-in');
    setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('welcome-main-in');
        enableGuideAttention();
    }, 420);
}

// ===== 事件绑定 =====
document.getElementById('addBtn').addEventListener('click', addItem);
document.getElementById('categoryDropdownBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var existing = document.getElementById('categoryDropdownMenu');
    if (existing) { existing.remove(); return; }
    var groups = buildGroups();
    if (groups.length === 0) return;
    var menu = document.createElement('div');
    menu.className = 'category-dropdown-menu';
    menu.id = 'categoryDropdownMenu';
    for (var i = 0; i < groups.length; i++) {
        var cat = groups[i].category;
        var btn = document.createElement('button');
        btn.textContent = cat;
        btn.addEventListener('click', function (c) {
            return function () {
                document.getElementById('categoryInput').value = c;
                document.getElementById('categoryInput').focus();
                document.getElementById('itemInput').focus();
                menu.remove();
            };
        }(cat));
        menu.appendChild(btn);
    }
    this.parentElement.appendChild(menu);
});
setupSplitInput('categoryInput', 'itemInput', addItem);
document.getElementById('newUserGuideBtn').addEventListener('click', transitionToTeachingMode);
document.getElementById('enterWelcomeBtn').addEventListener('click', enterWelcomePage);
document.getElementById('neverShowGuideBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    disableGuideAttention();
});
document.getElementById('backFromTeachingBtn').addEventListener('click', handleTeachingBack);
document.getElementById('cancelTeachingExitBtn').addEventListener('click', closeTeachingExitDialog);
document.getElementById('confirmTeachingExitBtn').addEventListener('click', function () {
    closeTeachingExitDialog();
    transitionToHomeMode();
});
document.getElementById('teachingExitOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeTeachingExitDialog();
});
document.getElementById('teachingNextBtn').addEventListener('click', function () {
    if (teachingStep === teachingLatestStep && !isTeachingStepComplete()) return;
    if (teachingStep === 14 && teachingFeatureIndex < 2) {
        teachingFeatureIndex++;
        setTeachingStep(14);
        return;
    }
    if (teachingStep === 15 && teachingFeatureIndex < 1) {
        teachingFeatureIndex++;
        setTeachingStep(15);
        return;
    }
    if (teachingStep === 16) {
        transitionToHomeMode();
        return;
    }
    if (teachingStep === 14 || teachingStep === 15) teachingFeatureIndex = 0;
    teachingLatestStep = Math.max(teachingLatestStep, teachingStep + 1);
    setTeachingStep(teachingStep + 1);
});
document.getElementById('teachingPrevBtn').addEventListener('click', function () {
    if (teachingStep === 14 && teachingFeatureIndex > 0) {
        teachingFeatureIndex--;
        setTeachingStep(14);
        return;
    }
    if (teachingStep === 15 && teachingFeatureIndex > 0) {
        teachingFeatureIndex--;
        setTeachingStep(15);
        return;
    }
    teachingFeatureIndex = 0;
    setTeachingStep(Math.max(0, teachingStep - 1));
});
document.getElementById('pickBtn').addEventListener('click', pick);
document.getElementById('toggleResultBtn').addEventListener('click', toggleResult);
document.getElementById('normalModeBtn').addEventListener('click', () => switchMode('normal'));
document.getElementById('tagModeBtn').addEventListener('click', () => switchMode('tags'));
document.getElementById('statsBtn').addEventListener('click', function () {
    if (document.body.classList.contains('teaching-mode')) return;
    renderStats();
    document.getElementById('statsOverlay').classList.add('show');
});
document.getElementById('statsCloseBtn').addEventListener('click', function () {
    document.getElementById('statsOverlay').classList.remove('show');
});
document.getElementById('statsTogglePick').addEventListener('change', function () {
    statsShowPick = this.checked;
    renderStats();
});
document.getElementById('statsToggleEaten').addEventListener('change', function () {
    statsShowEaten = this.checked;
    renderStats();
});
document.getElementById('statsOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});

// 今天我吃了……
document.getElementById('iAteBtn').addEventListener('click', function () {
    if (document.body.classList.contains('teaching-mode')) return;
    var catSelect = document.getElementById('eatenCategorySelect');
    var itemSelect = document.getElementById('eatenItemSelect');
    var confirmBtn = document.getElementById('eatenConfirmBtn');
    var groups = buildGroups();
    catSelect.innerHTML = '<option value="">选择类别</option>';
    for (var i = 0; i < groups.length; i++) {
        catSelect.innerHTML += '<option value="' + escapeAttribute(groups[i].category) + '">' + escapeHtml(groups[i].category) + '</option>';
    }
    itemSelect.innerHTML = '<option value="">选择项目</option>';
    itemSelect.disabled = true;
    confirmBtn.disabled = true;
    document.getElementById('eatenDialogOverlay').classList.add('show');
});

document.getElementById('eatenCategorySelect').addEventListener('change', function () {
    var cat = this.value;
    var itemSelect = document.getElementById('eatenItemSelect');
    var confirmBtn = document.getElementById('eatenConfirmBtn');
    itemSelect.innerHTML = '<option value="">选择项目</option>';
    if (!cat) { itemSelect.disabled = true; confirmBtn.disabled = true; return; }
    var catItems = items.filter(function (item) { return getItemCategory(item) === cat; });
    for (var i = 0; i < catItems.length; i++) {
        var name = getItemNameInCategory(catItems[i], cat);
        itemSelect.innerHTML += '<option value="' + escapeAttribute(catItems[i]) + '">' + escapeHtml(name) + '</option>';
    }
    itemSelect.disabled = false;
    confirmBtn.disabled = true;
});

document.getElementById('eatenItemSelect').addEventListener('change', function () {
    document.getElementById('eatenConfirmBtn').disabled = !this.value;
});

document.getElementById('eatenConfirmBtn').addEventListener('click', function () {
    var item = document.getElementById('eatenItemSelect').value;
    if (!item) return;
    incrementEatenCount(item);
    document.getElementById('eatenDialogOverlay').classList.remove('show');
    showToast('已记录');
});

document.getElementById('eatenCancelBtn').addEventListener('click', function () {
    document.getElementById('eatenDialogOverlay').classList.remove('show');
});

document.getElementById('eatenDialogOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});

document.getElementById('drawTagBtn').addEventListener('click', drawRandomTag);
document.getElementById('toggleDrawHistoryBtn').addEventListener('click', toggleDrawHistory);
document.getElementById('clearDrawHistoryBtn').addEventListener('click', clearDrawHistory);
document.getElementById('pauseTagsBtn').addEventListener('click', toggleTagPause);
document.getElementById('motionSpeedInput').addEventListener('input', function () {
    tagMotionSpeed = parseFloat(this.value) || 1;
});
document.getElementById('drawDurationMinusBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    setDrawDurationSeconds(drawDurationSeconds - 0.1);
});
document.getElementById('drawDurationPlusBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    setDrawDurationSeconds(drawDurationSeconds + 0.1);
});
updateDrawDurationDisplay();
document.getElementById('tagBoard').addEventListener('click', hideTagReveal);
document.getElementById('tagRevealOverlay').addEventListener('click', hideTagReveal);
document.getElementById('formatHelpBtn').addEventListener('click', function () {
    document.getElementById('formatHelpOverlay').classList.add('show');
});
document.getElementById('formatHelpClose').addEventListener('click', function () {
    document.getElementById('formatHelpOverlay').classList.remove('show');
});
document.getElementById('formatHelpOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
});
document.getElementById('mockExampleFileBtn').addEventListener('click', applyTeachingMockImport);
document.getElementById('cancelMockImportBtn').addEventListener('click', closeTeachingMockImport);
document.getElementById('teachingMockImportOverlay').addEventListener('click', function (e) {
    if (e.target === this && teachingMockImportDone) closeTeachingMockImport();
});
document.getElementById('exportBtn').addEventListener('click', function () {
    if (document.body.classList.contains('teaching-mode')) return;
    exportListFile();
});
document.getElementById('importBtn').addEventListener('click', function () {
    if (document.body.classList.contains('teaching-mode')) {
        if (teachingStep === 7 && !teachingMockImportDone) {
            document.getElementById('settingsMenu').classList.remove('open');
            this.closest('.settings-wrap')?.classList.remove('open');
            openTeachingMockImport();
        }
        return;
    }
    openImportFile();
});
document.getElementById('shareCodeGenBtn').addEventListener('click', function (e) {
    if (document.body.classList.contains('teaching-mode')) return;
    e.stopPropagation();
    document.getElementById('settingsMenu').classList.remove('open');
    this.closest('.settings-wrap').classList.remove('open');
    openShareCodeView();
});
document.getElementById('shareCodeImpBtn').addEventListener('click', function (e) {
    if (document.body.classList.contains('teaching-mode')) return;
    e.stopPropagation();
    document.getElementById('settingsMenu').classList.remove('open');
    this.closest('.settings-wrap').classList.remove('open');
    openShareCodeImport();
});
document.getElementById('settingsBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    const menu = document.getElementById('settingsMenu');
    const isOpen = menu.classList.toggle('open');
    this.closest('.settings-wrap').classList.toggle('open', isOpen);
    if (document.body.classList.contains('teaching-import-step') && !teachingMockImportDone) {
        document.getElementById('importBtn')?.classList.toggle('teaching-highlight', isOpen);
    }
});
document.getElementById('resetStatsBtn').addEventListener('click', function (e) {
    if (document.body.classList.contains('teaching-mode')) return;
    e.stopPropagation();
    document.getElementById('settingsMenu').classList.remove('open');
    this.closest('.settings-wrap').classList.remove('open');
    if (confirm('确认归零所有抽取次数和吃过次数？此操作不可撤销。')) {
        resetPickCounts();
    }
});
document.getElementById('bulkMenuBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    document.getElementById('settingsMenu').classList.remove('open');
    this.closest('.settings-wrap').classList.remove('open');
    openBulkEditPicker();
});
document.getElementById('importFileInput').addEventListener('change', function () {
    handleImportFile(this.files[0]);
});
document.getElementById('undoImportBtn').addEventListener('click', undoImport);
document.getElementById('mergeImportBtn').addEventListener('click', () => applyImport('merge'));
document.getElementById('overwriteImportBtn').addEventListener('click', function () {
    if (confirm('覆盖导入将清空当前列表，替换为导入内容。确定继续？')) {
        applyImport('overwrite');
    }
});
document.getElementById('cancelImportBtn').addEventListener('click', cancelImport);
document.getElementById('importDialogOverlay').addEventListener('click', function (e) {
    if (e.target === this) cancelImport();
});
document.getElementById('shareCodeViewConfirmBtn').addEventListener('click', closeShareCodeView);
document.getElementById('shareCodeViewCopyBtn').addEventListener('click', copyShareCode);
document.getElementById('shareCodeImportConfirmBtn').addEventListener('click', handleShareCodeImport);
document.getElementById('shareCodeImportCancelBtn').addEventListener('click', closeShareCodeImport);
document.getElementById('listSearchInput').addEventListener('input', function () {
    listSearchQuery = this.value.trim().toLowerCase();
    render();
});
document.getElementById('saveBulkEditBtn').addEventListener('click', saveBulkEdit);
document.getElementById('cancelBulkEditBtn').addEventListener('click', closeBulkEdit);
document.getElementById('bulkEditOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeBulkEdit();
});
document.addEventListener('keydown', function (e) {
    if (!document.body.classList.contains('teaching-mode')) return;
    if (e.key !== 'Enter') return;
    const nextBtn = document.getElementById('teachingNextBtn');
    if (!nextBtn || nextBtn.disabled) return;
    e.preventDefault();
    nextBtn.click();
});

document.addEventListener('click', function (e) {
    const settingsWrap = document.querySelector('.settings-wrap');
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsWrap && settingsMenu && settingsMenu.classList.contains('open') && !e.target.closest('.settings-wrap')) {
        settingsWrap.classList.remove('open');
        settingsMenu.classList.remove('open');
    }

    var itemPopover = document.getElementById('itemPopover');
    if (itemPopover && !e.target.closest('#itemPopover') && !e.target.closest('.item-more-btn')) {
        closeItemPopover();
    }

    var catDropdown = document.getElementById('categoryDropdownMenu');
    if (catDropdown && !e.target.closest('#categoryDropdownMenu') && !e.target.closest('#categoryDropdownBtn')) {
        catDropdown.remove();
    }

    const editingRow = document.querySelector('li.item-row.editing');
    if (editingRow && !e.target.closest('li.item-row.editing')) {
        if (ignoreNextEditOutsideClick) {
            ignoreNextEditOutsideClick = false;
        } else {
            cancelInlineEdit();
        }
    }

    if (currentMode !== 'tags') return;
    const rightPanel = document.querySelector('.right-panel');
    const clickedInsideRightPanel = e.composedPath().some(el => el?.classList?.contains('right-panel'));
    if (rightPanel.classList.contains('drawer-open') && !clickedInsideRightPanel) {
        rightPanel.classList.remove('drawer-open');
    }
});

// 展开/收起列表
document.getElementById('listHeader').addEventListener('click', function (e) {
    // 不拦截展开/设置菜单按钮的点击
    if (e.target.closest('#expandAllBtn') || e.target.closest('#drawScopeAllBtn') || e.target.closest('.settings-wrap')) return;
    if (items.length === 0 || document.body.classList.contains('teaching-mode')) {
        ensureListOpen();
        return;
    }
    if (currentMode === 'tags') {
        document.querySelector('.right-panel').classList.toggle('drawer-open');
    }
});

document.getElementById('expandAllBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    toggleAllCategories();
});

document.getElementById('drawScopeAllBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    toggleAllDrawCategories();
});

// 拖拽排序（事件委托在 <ul> 上）
(function setupDrag() {
    const list = document.getElementById('list');
    let dragCategory = '';
    let dragItemIndex = -1;
    let dragItemCategory = '';
    let touchDragState = null;
    let pressFeedbackState = null;
    const touchDragDelay = 420;

    function clearPressFeedback() {
        if (!pressFeedbackState) return;
        clearTimeout(pressFeedbackState.timer);
        pressFeedbackState.element.classList.remove('touch-dragging');
        pressFeedbackState = null;
    }

    function resetDragState() {
        clearPressFeedback();
        list.querySelectorAll('li.drag-insert-before, li.drag-insert-after, li.touch-dragging').forEach(el => {
            el.classList.remove('drag-insert-before', 'drag-insert-after', 'touch-dragging');
        });
        dragCategory = '';
        dragItemIndex = -1;
        dragItemCategory = '';
    }

    function getDragTargetFromHandle(handle) {
        const categoryLi = handle.closest('li.category');
        const itemLi = handle.closest('li.item-row');
        if (categoryLi) {
            return {
                type: 'category',
                element: categoryLi,
                category: categoryLi.dataset.category
            };
        }
        if (itemLi) {
            return {
                type: 'item',
                element: itemLi,
                index: parseInt(itemLi.dataset.index),
                category: itemLi.dataset.category
            };
        }
        return null;
    }

    function getDragTargetFromPress(target) {
        const handle = target.closest('.drag-handle');
        if (!handle) return null;
        return getDragTargetFromHandle(handle);
    }

    function markDragOver(clientY, target) {
        list.querySelectorAll('li.drag-insert-before, li.drag-insert-after').forEach(el => el.classList.remove('drag-insert-before', 'drag-insert-after'));

        if (dragCategory) {
            const li = target?.closest?.('li.category');
            if (!li || li.dataset.category === dragCategory) return;
            const rect = li.getBoundingClientRect();
            li.classList.add(clientY > rect.top + rect.height / 2 ? 'drag-insert-after' : 'drag-insert-before');
            return;
        }

        if (dragItemIndex >= 0) {
            const li = target?.closest?.('li.item-row');
            if (!li || li.dataset.category !== dragItemCategory || parseInt(li.dataset.index) === dragItemIndex) return;
            const rect = li.getBoundingClientRect();
            li.classList.add(clientY > rect.top + rect.height / 2 ? 'drag-insert-after' : 'drag-insert-before');
        }
    }

    function applyDragDrop(target) {
        if (dragCategory) {
            const li = target?.closest?.('li.category');
            if (!li) return false;
            const insertAfter = li.classList.contains('drag-insert-after');
            const targetCategory = li.dataset.category;
            if (targetCategory === dragCategory) return false;

            const groups = buildGroups();
            const order = groups.map(group => group.category);
            const fromIndex = order.indexOf(dragCategory);
            const targetIndex = order.indexOf(targetCategory);
            if (fromIndex < 0 || targetIndex < 0) return false;

            const [moved] = order.splice(fromIndex, 1);
            let insertIndex = targetIndex;
            if (fromIndex < targetIndex) insertIndex--;
            if (insertAfter) insertIndex++;
            order.splice(insertIndex, 0, moved);
            categoryOrder = order;
            saveCategoryOrder(categoryOrder);
            suppressNextListAnimation = true;
            sortItems();
            markListChanged();
            return true;
        }

        if (dragItemIndex >= 0) {
            const li = target?.closest?.('li.item-row');
            if (!li || li.dataset.category !== dragItemCategory) return false;
            const insertAfter = li.classList.contains('drag-insert-after');
            const targetIndex = parseInt(li.dataset.index);
            if (moveItemWithinCategory(dragItemIndex, targetIndex, insertAfter)) {
                tagLayout = [];
                suppressNextListAnimation = true;
                render();
                markListChanged();
                return true;
            }
        }

        return false;
    }

    list.addEventListener('dragstart', function (e) {
        const dragTarget = getDragTargetFromHandle(e.target);
        if (!dragTarget) return;

        if (dragTarget.type === 'category') {
            dragCategory = dragTarget.category;
        } else {
            dragItemIndex = dragTarget.index;
            dragItemCategory = dragTarget.category;
        }
        dragTarget.element.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
        // 设置空数据以允许拖拽（Firefox 需要）
        e.dataTransfer.setData('text/plain', '');
    });

    list.addEventListener('dragend', function (e) {
        const categoryLi = e.target.closest('li.category');
        const itemLi = e.target.closest('li.item-row');
        if (categoryLi) {
            categoryLi.classList.remove('dragging');
            categoryLi.classList.add('drag-click-skip');
        }
        if (itemLi) itemLi.classList.remove('dragging');
        resetDragState();
    });

    list.addEventListener('dragover', function (e) {
        markDragOver(e.clientY, e.target);
        if (dragCategory || dragItemIndex >= 0) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    });

    list.addEventListener('drop', function (e) {
        e.preventDefault();
        applyDragDrop(e.target);
        resetDragState();
    });

    list.addEventListener('pointerdown', function (e) {
        const dragTarget = getDragTargetFromPress(e.target);
        if (!dragTarget) return;

        clearPressFeedback();
        pressFeedbackState = {
            pointerId: e.pointerId,
            element: dragTarget.element,
            startX: e.clientX,
            startY: e.clientY,
            timer: setTimeout(() => {
                if (pressFeedbackState?.pointerId === e.pointerId) {
                    dragTarget.element.classList.add('touch-dragging');
                }
            }, 180)
        };

        if (e.pointerType !== 'touch') return;

        touchDragState = {
            pointerId: e.pointerId,
            target: dragTarget,
            startX: e.clientX,
            startY: e.clientY,
            active: false,
            timer: null
        };

        touchDragState.timer = setTimeout(() => {
            if (!touchDragState) return;
            touchDragState.active = true;
            if (dragTarget.type === 'category') {
                dragCategory = dragTarget.category;
            } else {
                dragItemIndex = dragTarget.index;
                dragItemCategory = dragTarget.category;
            }
            dragTarget.element.classList.add('touch-dragging');
            dragTarget.element.setPointerCapture?.(e.pointerId);
        }, touchDragDelay);
    });

    list.addEventListener('pointermove', function (e) {
        if (!touchDragState || touchDragState.pointerId !== e.pointerId) return;

        const moved = Math.hypot(e.clientX - touchDragState.startX, e.clientY - touchDragState.startY);
        if (!touchDragState.active && moved > 10) {
            clearTimeout(touchDragState.timer);
            touchDragState = null;
            return;
        }

        if (!touchDragState.active) return;
        e.preventDefault();
        const target = document.elementFromPoint(e.clientX, e.clientY);
        markDragOver(e.clientY, target);
    });

    function endTouchDrag(e) {
        if (!touchDragState || touchDragState.pointerId !== e.pointerId) return;
        clearTimeout(touchDragState.timer);

        if (touchDragState.active) {
            e.preventDefault();
            const target = document.elementFromPoint(e.clientX, e.clientY);
            applyDragDrop(target);
            touchDragState.target.element.classList.add('drag-click-skip');
        }

        touchDragState = null;
        resetDragState();
    }

    list.addEventListener('pointerup', endTouchDrag);
    list.addEventListener('pointercancel', endTouchDrag);
    list.addEventListener('pointerup', clearPressFeedback);
    list.addEventListener('pointercancel', clearPressFeedback);
})();

formatAllItems();
render();
renderDrawHistory();
