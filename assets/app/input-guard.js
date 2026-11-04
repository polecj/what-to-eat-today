/* 实时输入白名单：只过滤本次插入内容，不重写旧列表里已有的历史字符。 */
(function (root) {
    'use strict';
    const bound = new WeakSet();
    function bind(input, kind = 'name') {
        if (!input || bound.has(input)) return;
        bound.add(input);
        let previous = input.value;
        let composing = false;
        const notice = () => {
            if (typeof root.showToast === 'function') root.showToast(kind === 'category'
                ? '类别只允许汉字、英文字母和数字，已拦截其他字符'
                : '已拦截禁用字符，允许的符号可在“输入格式说明”查看');
        };
        function reconcile() {
            const value = input.value;
            let start = 0;
            while (start < previous.length && start < value.length && previous[start] === value[start]) start++;
            let oldEnd = previous.length;
            let newEnd = value.length;
            while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === value[newEnd - 1]) { oldEnd--; newEnd--; }
            const inserted = value.slice(start, newEnd);
            const allowed = root.FoodData.filterInput(inserted, kind);
            if (inserted !== allowed) {
                const caret = input.selectionStart ?? value.length;
                const nextCaret = caret <= start ? caret : caret <= newEnd
                    ? start + root.FoodData.filterInput(value.slice(start, caret), kind).length
                    : caret - inserted.length + allowed.length;
                input.value = value.slice(0, start) + allowed + value.slice(newEnd);
                input.setSelectionRange(nextCaret, nextCaret);
                notice();
            }
            input.setCustomValidity('');
            previous = input.value;
        }
        function insert(text) {
            const filtered = root.FoodData.filterInput(text, kind);
            if (filtered !== text) notice();
            // 全部被拦截时保留原选区内容，不把禁用按键当成删除操作。
            if (!filtered) return;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? start;
            const remaining = input.maxLength < 0 ? Infinity : Math.max(0, input.maxLength - input.value.length + end - start);
            let added = '';
            for (const character of filtered) {
                if (added.length + character.length > remaining) break;
                added += character;
            }
            input.setRangeText(added, start, end, 'end');
            previous = input.value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        input.addEventListener('focus', () => { previous = input.value; });
        input.addEventListener('beforeinput', event => {
            if (input.readOnly || input.disabled || composing || event.isComposing || !event.cancelable) return;
            if (!event.inputType?.startsWith('insert') || event.data == null) return;
            previous = input.value;
            if (root.FoodData.filterInput(event.data, kind) !== event.data) {
                event.preventDefault();
                insert(event.data);
            }
        });
        input.addEventListener('paste', event => {
            if (input.readOnly || input.disabled || composing || !event.clipboardData) return;
            const text = event.clipboardData.getData('text/plain');
            if (root.FoodData.filterInput(text, kind) === text) { previous = input.value; return; }
            event.preventDefault();
            insert(text);
        });
        input.addEventListener('compositionstart', () => { previous = input.value; composing = true; });
        input.addEventListener('compositionend', () => { composing = false; reconcile(); });
        // 捕获阶段先清理，再让业务 input 监听读取值；中文拼音组合中不改写输入。
        input.addEventListener('input', event => {
            if (!composing && !event.isComposing) reconcile();
        }, true);
    }
    const symbols = document.getElementById('allowedNameSymbols');
    if (symbols) {
        symbols.style.overflowWrap = 'anywhere';
        symbols.textContent = root.FoodData.NAME_SYMBOLS.join(' ');
    }
    root.FoodInput = { bind };
})(window);
