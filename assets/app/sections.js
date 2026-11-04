(() => {
    'use strict';

    const sections = {
        wishlist: {
            title: '之后想吃',
            description: '记下之后想吃的，按你的心意排序。',
            placeholder: '想吃什么？回车添加',
            key: 'picker_wishlist_items'
        },
        snacks: {
            title: '饭后加餐',
            description: '路边摊、小吃或饭后想加的一口，都记在这里。',
            placeholder: '加餐吃什么？回车添加',
            key: 'picker_snacks_items'
        }
    };
    const nav = document.querySelector('.mode-switch');
    const buttons = Array.from(nav.querySelectorAll('[data-section]'));
    const picker = document.getElementById('pickerPanel');
    const panel = document.getElementById('lightListPanel');
    const title = document.getElementById('lightListTitle');
    const description = document.getElementById('lightListDescription');
    const form = document.getElementById('lightListForm');
    const input = document.getElementById('lightListInput');
    FoodInput.bind(input, 'name');
    const list = document.getElementById('lightListItems');
    const count = document.getElementById('lightListCount');
    const error = document.getElementById('lightListError');
    const status = document.getElementById('lightListStatus');
    const backupHint = document.getElementById('backupHint');
    const drafts = { wishlist: '', snacks: '' };
    const loadErrors = {};
    const lists = { wishlist: load('wishlist'), snacks: load('snacks') };
    let current = 'picker';
    let drag = null;
    let touch = null;
    let scrollFrame = 0;
    let skipClickUntil = 0;

    function load(section) {
        try {
            const raw = localStorage.getItem(sections[section].key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) {
                throw new Error('Invalid list');
            }
            return parsed;
        } catch (_) {
            loadErrors[section] = '无法读取此清单。添加前请检查浏览器存储权限，或先备份原有数据。';
            return [];
        }
    }

    function inTeaching() {
        return document.body.classList.contains('teaching-mode');
    }

    function announce(message) {
        status.textContent = message;
    }

    function showError(message) {
        error.textContent = message;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function commit(next, message, focusIndex, focusAction) {
        if (inTeaching() || current === 'picker') return false;
        if (loadErrors[current]) {
            showError(loadErrors[current]);
            return false;
        }
        try {
            localStorage.setItem(sections[current].key, JSON.stringify(next));
        } catch (_) {
            showError('保存失败，清单未更改。请检查浏览器存储权限或可用空间后重试。');
            return false;
        }
        lists[current] = next;
        showError('');
        render();
        announce(message);
        if (focusIndex !== undefined) {
            const row = list.children[focusIndex];
            const control = row?.querySelector(`[data-action="${focusAction || 'up'}"]:not(:disabled)`)
                || row?.querySelector('button:not(:disabled)');
            (control || input).focus();
        }
        return true;
    }

    function makeButton(text, action, label, disabled = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.dataset.action = action;
        button.className = `light-list-${action}`;
        button.setAttribute('aria-label', label);
        button.title = label;
        button.disabled = disabled;
        return button;
    }

    function render() {
        list.replaceChildren();
        if (current === 'picker') return;
        const items = lists[current];
        count.textContent = `共 ${items.length} 项`;
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'light-list-empty';
            empty.textContent = current === 'wishlist' ? '还没有记下想吃的，先添加一个吧。' : '加餐清单还是空的，先记下喜欢的吧。';
            list.appendChild(empty);
            return;
        }
        items.forEach((name, index) => {
            const row = document.createElement('li');
            row.className = 'light-list-item';
            row.dataset.index = String(index);
            row.draggable = true;
            const handle = makeButton('⠿', 'handle', `长按拖动：${name}；也可使用上移、下移按钮`);
            const text = document.createElement('span');
            text.className = 'light-list-name';
            text.textContent = name;
            const actions = document.createElement('span');
            actions.className = 'light-list-actions';
            actions.append(
                makeButton('↑', 'up', `上移：${name}`, index === 0),
                makeButton('↓', 'down', `下移：${name}`, index === items.length - 1),
                makeButton('删除', 'delete', `删除：${name}`)
            );
            row.append(handle, text, actions);
            list.appendChild(row);
        });
    }

    // Public integration point: app.js calls this before entering teaching mode.
    // Returns false for invalid sections or a section change during teaching.
    window.switchSection = function switchSection(section) {
        if (section !== 'picker' && !Object.hasOwn(sections, section)) return false;
        if (inTeaching() && section !== current) return false;
        if (section === current && nav.dataset.section === section) return true;
        if (current !== 'picker') drafts[current] = input.value;
        cancelDrag();
        if (typeof window.cancelPick === 'function') window.cancelPick();
        if (typeof window.closeItemPopover === 'function') window.closeItemPopover();
        if (typeof window.cancelInlineEdit === 'function') window.cancelInlineEdit();
        document.querySelectorAll('.menu-dropdown.open, .category-dropdown-menu.open')
            .forEach(menu => menu.classList.remove('open'));
        const focusWasInPanel = picker.contains(document.activeElement) || panel.contains(document.activeElement);
        current = section;
        nav.dataset.section = section;
        document.body.dataset.section = section;
        picker.hidden = section !== 'picker';
        panel.hidden = section === 'picker';
        backupHint.hidden = section !== 'picker';
        buttons.forEach(button => {
            const active = button.dataset.section === section;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        if (section !== 'picker') {
            title.textContent = sections[section].title;
            description.textContent = sections[section].description;
            input.placeholder = sections[section].placeholder;
            input.value = drafts[section];
            showError(loadErrors[section] || '');
            render();
        }
        announce('');
        if (focusWasInPanel) buttons.find(button => button.dataset.section === section)?.focus();
        return true;
    };

    buttons.forEach(button => button.addEventListener('click', () => window.switchSection(button.dataset.section)));
    nav.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || inTeaching()) return;
        const index = buttons.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
        window.switchSection(buttons[next].dataset.section);
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (current === 'picker' || inTeaching()) return;
        const data = window.FoodData;
        if (!data || typeof data.normalizeName !== 'function' || typeof data.validateName !== 'function') {
            showError('名称校验暂不可用，请刷新页面后重试。');
            return;
        }
        const message = data.validateName(input.value);
        const name = data.normalizeName(input.value);
        if (message) {
            showError(message);
            input.focus();
            return;
        }
        if (lists[current].includes(name)) {
            showError('此清单已包含这个名称。');
            input.focus();
            return;
        }
        if (commit([...lists[current], name], `已添加：${name}`)) {
            input.value = '';
            drafts[current] = '';
            input.focus();
        }
    });
    input.addEventListener('input', () => showError(loadErrors[current] || ''));

    list.addEventListener('click', event => {
        if (Date.now() < skipClickUntil || inTeaching()) return;
        const button = event.target.closest('button[data-action]');
        const row = button?.closest('.light-list-item');
        if (!row || current === 'picker' || drag || touch?.active) return;
        const index = Number(row.dataset.index);
        const next = lists[current].slice();
        const name = next[index];
        const action = button.dataset.action;
        if (action === 'delete') {
            next.splice(index, 1);
            commit(next, `已删除：${name}`, Math.min(index, next.length - 1), 'delete');
        } else if (action === 'up' || action === 'down') {
            const target = index + (action === 'up' ? -1 : 1);
            if (target < 0 || target >= next.length) return;
            [next[index], next[target]] = [next[target], next[index]];
            commit(next, `已将 ${name} 移至第 ${target + 1} 项`, target, action);
        }
    });

    function clearMarkers() {
        list.querySelectorAll('.light-insert-before, .light-insert-after').forEach(row => {
            row.classList.remove('light-insert-before', 'light-insert-after');
        });
    }

    function markTarget(x, y) {
        clearMarkers();
        if (!drag) return;
        const element = document.elementFromPoint(x, y);
        const row = element?.closest('.light-list-item');
        drag.target = null;
        if (!row || !list.contains(row) || Number(row.dataset.index) === drag.from) return;
        const bounds = row.getBoundingClientRect();
        drag.target = Number(row.dataset.index);
        drag.after = y > bounds.top + bounds.height / 2;
        row.classList.add(drag.after ? 'light-insert-after' : 'light-insert-before');
    }

    function applyDrop() {
        if (!drag || drag.target === null || drag.section !== current || inTeaching()) return;
        const next = lists[current].slice();
        let target = drag.target + (drag.after ? 1 : 0);
        if (target > drag.from) target--;
        if (target === drag.from) return;
        const [name] = next.splice(drag.from, 1);
        next.splice(target, 0, name);
        commit(next, `已将 ${name} 移至第 ${target + 1} 项`);
    }

    function cancelDrag() {
        if (touch) {
            clearTimeout(touch.timer);
            if (touch.handle.hasPointerCapture?.(touch.id)) touch.handle.releasePointerCapture(touch.id);
            touch = null;
        }
        cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
        clearMarkers();
        list.querySelectorAll('.light-dragging').forEach(row => row.classList.remove('light-dragging'));
        drag = null;
    }

    list.addEventListener('dragstart', event => {
        const row = event.target.closest('.light-list-item');
        if (!row || touch || inTeaching() || event.target.closest('button:not(.light-list-handle)')) {
            event.preventDefault();
            return;
        }
        drag = { from: Number(row.dataset.index), target: null, after: false, section: current };
        row.classList.add('light-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', row.dataset.index);
    });
    list.addEventListener('dragover', event => {
        if (!drag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        markTarget(event.clientX, event.clientY);
    });
    list.addEventListener('drop', event => {
        if (!drag) return;
        event.preventDefault();
        markTarget(event.clientX, event.clientY);
        applyDrop();
        cancelDrag();
    });
    list.addEventListener('dragend', cancelDrag);

    function autoScroll() {
        if (!touch?.active) return;
        const bounds = list.getBoundingClientRect();
        const top = Math.max(0, bounds.top);
        const bottom = Math.min(window.innerHeight, bounds.bottom);
        const delta = touch.y < top + 44 ? -7 : touch.y > bottom - 44 ? 7 : 0;
        if (delta) {
            if (list.scrollHeight > list.clientHeight) list.scrollTop += delta;
            else window.scrollBy(0, delta);
            markTarget(touch.x, touch.y);
        }
        scrollFrame = requestAnimationFrame(autoScroll);
    }

    list.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' || inTeaching()) return;
        const handle = event.target.closest('.light-list-handle');
        const row = handle?.closest('.light-list-item');
        if (!row) return;
        cancelDrag();
        touch = { id: event.pointerId, handle, row, x: event.clientX, y: event.clientY,
            startX: event.clientX, startY: event.clientY, active: false, timer: 0 };
        touch.timer = setTimeout(() => {
            if (!touch) return;
            touch.active = true;
            drag = { from: Number(row.dataset.index), target: null, after: false, section: current };
            row.classList.add('light-dragging');
            handle.setPointerCapture?.(event.pointerId);
            announce('已开始拖动，移动到目标位置后松开；也可按 Escape 取消。');
            scrollFrame = requestAnimationFrame(autoScroll);
        }, 320);
    });
    document.addEventListener('pointermove', event => {
        if (!touch || event.pointerId !== touch.id) return;
        touch.x = event.clientX;
        touch.y = event.clientY;
        if (!touch.active) {
            if (Math.hypot(touch.x - touch.startX, touch.y - touch.startY) > 10) cancelDrag();
            return;
        }
        event.preventDefault();
        markTarget(touch.x, touch.y);
    }, { passive: false });
    document.addEventListener('pointerup', event => {
        if (!touch || event.pointerId !== touch.id) return;
        if (touch.active) {
            event.preventDefault();
            skipClickUntil = Date.now() + 400;
            markTarget(event.clientX, event.clientY);
            applyDrop();
        }
        cancelDrag();
    });
    document.addEventListener('pointercancel', event => {
        if (touch && event.pointerId === touch.id) cancelDrag();
    });
    list.addEventListener('contextmenu', event => {
        if (event.target.closest('.light-list-handle')) event.preventDefault();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && (drag || touch)) {
            cancelDrag();
            announce('已取消拖动。');
        }
    });
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('storage', event => {
        const section = Object.keys(sections).find(key => sections[key].key === event.key);
        if (!section) return;
        cancelDrag();
        delete loadErrors[section];
        lists[section] = load(section);
        if (section === current) {
            showError(loadErrors[section] || '');
            render();
            announce('已同步此浏览器中另一页面的清单。');
        }
    });

    document.body.dataset.section = 'picker';
})();
