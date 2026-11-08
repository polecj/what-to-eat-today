/* 共用输入与分类列表，仅切换当前清单的数据和下方内容。 */
(() => {
    'use strict';
    const definitions = {
        wishlist: { title: '之后想吃', description: '记下平时发现的好店，按类别整理，之后慢慢去吃。' },
        picker: { title: '是啊吃什么', description: '把你的心头好按类别收好，今天吃什么交给抽取。' },
        snacks: { title: '饭后加餐', description: '路边摊、小吃与饭后加餐，也能分门别类记下来。' }
    };
    const order = ['wishlist', 'picker', 'snacks'];
    const buttons = [...document.querySelectorAll('.mode-switch [data-section]')];
    const nav = document.querySelector('.mode-switch');
    const content = document.getElementById('sectionContent');
    const viewport = document.getElementById('sectionListViewport');
    let animation = null;
    let ghostAnimation = null;
    let ghost = null;

    function capture() {
        return { items: [...items], categoryOrder: [...categoryOrder], collapsedCategories: [...collapsedCategories],
            uncheckedCategories: [...uncheckedCategories], hasUnsavedExport, listSearchQuery,
            searchCollapsedCategories: new Set(searchCollapsedCategories), newItemsUntilNextDraw: new Set(newItemsUntilNextDraw),
            undoImportState, latestResultText, resultHidden, resultMarkup: document.getElementById('result').innerHTML,
            confirmVisible: document.getElementById('toggleResultBtn').style.display };
    }
    function restore(state) {
        items = [...state.items];
        categoryOrder = [...state.categoryOrder];
        collapsedCategories = [...state.collapsedCategories];
        uncheckedCategories = [...(state.uncheckedCategories || [])];
        hasUnsavedExport = state.hasUnsavedExport || false;
        setListSearchQuery(state.listSearchQuery || '');
        searchCollapsedCategories = new Set(state.searchCollapsedCategories || []);
        newItemsUntilNextDraw = new Set(state.newItemsUntilNextDraw || []);
        undoImportState = state.undoImportState || null;
        categoriesToAnimate.clear(); categoriesToHighlight.clear(); itemsToHighlight.clear();
        pickedItemIndex = -1; pickedCategory = ''; autoExpandedCategory = '';
        document.getElementById('listSearchInput').value = listSearchQuery;
        latestResultText = state.latestResultText || '';
        resultHidden = state.resultHidden ?? true;
        const result = document.getElementById('result');
        // 确认后的清晰结果可恢复，不恢复切换前尚在滚动的临时候选。
        result.textContent = state.confirmVisible === 'inline-block' ? latestResultText : '';
        result.classList.toggle('hidden-result', resultHidden);
        setDrawStage(state.confirmVisible === 'inline-block' ? 'result' : 'idle');
        if (state.confirmVisible === 'inline-block') renderDrawReel(latestResultText);
    }
    function readSecondary(section) {
        try {
            return FoodLists.load(section, localStorage);
        } catch (error) {
            sectionLoadErrors.set(section, '此清单读取或迁移失败，已保留原数据。请检查浏览器存储权限或先备份原数据。');
            return { items: [], categoryOrder: [], collapsedCategories: [] };
        }
    }
    function stopSlide() {
        animation?.cancel(); ghostAnimation?.cancel();
        animation = null; ghostAnimation = null;
        ghost?.remove(); ghost = null;
    }
    function snapshot() {
        const clone = content.cloneNode(true);
        clone.classList.add('section-slide-ghost');
        clone.dataset.section = activeSection;
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        [clone, ...clone.querySelectorAll('[id]')].forEach(element => element.removeAttribute('id'));
        clone.querySelectorAll('button,input,textarea').forEach(element => { element.tabIndex = -1; });
        return clone;
    }
    window.refreshSectionHeading = function () {
        document.getElementById('sectionTitle').textContent = definitions[activeSection].title;
        document.getElementById('sectionDescription').textContent = definitions[activeSection].description;
        document.getElementById('sectionStorageNote').textContent = sectionLoadErrors.get(activeSection)
            || '当前清单独立保存在此浏览器；三个清单格式一致、记录互不混合，跨清单移动功能后续再加。';
        document.getElementById('addBtn').disabled = sectionLoadErrors.has(activeSection) || isCategoryInputInvalid(document.getElementById('categoryInput'));
    };
    window.switchSection = function (section, options = {}) {
        if (!Object.hasOwn(definitions, section)) return false;
        if (document.body.classList.contains('teaching-mode') && section !== activeSection) return false;
        if (section === activeSection) return true;
        const direction = order.indexOf(section) > order.indexOf(activeSection) ? 1 : -1;
        stopSlide();
        const animate = options.animate !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const outgoing = animate ? snapshot() : null;
        cancelPick(); closeItemPopover(); cancelInlineEdit();
        window.cancelListDrag?.();
        sectionStates.set(activeSection, capture());
        pendingImportData = null;
        document.querySelectorAll('.menu-dropdown.open,.category-dropdown-menu.open,.settings-wrap.open').forEach(element => element.classList.remove('open'));
        document.getElementById('categoryDropdownMenu')?.remove();
        document.querySelectorAll('.center-modal.show').forEach(element => element.classList.remove('show'));
        document.getElementById('exportReminder').classList.remove('show');
        hideImportUndoPrompt();
        activeSection = section;
        if (!sectionStates.has(section)) sectionStates.set(section, readSecondary(section));
        restore(sectionStates.get(section));
        nav.dataset.section = section;
        document.body.dataset.section = section;
        buttons.forEach(button => {
            const active = button.dataset.section === section;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        render(); updateExportStatus();
        if (undoImportState) showImportUndoPrompt();
        // 输入区 DOM、值、焦点均不改动；只为内容快照和新列表做左右平移。
        if (animate && typeof content.animate === 'function') {
            ghost = outgoing;
            viewport.appendChild(ghost);
            const timing = { duration: 260, easing: 'cubic-bezier(.22,.75,.25,1)' };
            ghostAnimation = ghost.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${-direction * 52}px)`, opacity: 0 }], timing);
            animation = content.animate([{ transform: `translateX(${direction * 52}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], timing);
            const current = animation;
            animation.finished.then(() => { if (animation === current) stopSlide(); }).catch(() => {});
        }
        return true;
    };
    buttons.forEach(button => button.addEventListener('click', () => switchSection(button.dataset.section)));
    nav.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || document.body.classList.contains('teaching-mode')) return;
        const index = buttons.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
        buttons[next].focus(); switchSection(buttons[next].dataset.section);
    });
    window.addEventListener('storage', event => {
        const section = Object.keys(FoodLists.keys).find(section => FoodLists.keys[section] === event.key);
        if (!section || document.body.classList.contains('teaching-mode')) return;
        sectionLoadErrors.delete(section);
        const fresh = readSecondary(section);
        sectionStates.set(section, fresh);
        if (activeSection === section) { closeItemPopover(); cancelInlineEdit(); restore(fresh); render(); updateExportStatus(); }
    });
    document.body.dataset.section = 'picker';
    sectionStates.set('picker', capture());
    refreshSectionHeading();
})();
