const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/app/app.js'), 'utf8');
function setup(reduced = false) {
    function element() {
        const classes = new Set();
        const props = {};
        return { textContent: '', className: '', attrs: {},
            classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) },
            style: { setProperty: (key, value) => { props[key] = value; }, removeProperty: key => { delete props[key]; }, getPropertyValue: key => props[key] || '' },
            setAttribute(key, value) { this.attrs[key] = value; },
            addEventListener() {},
            remove() { result.children = result.children.filter(item => item !== this); }
        };
    }
    const result = { children: [],
        replaceChildren() { this.children = []; },
        appendChild(child) { this.children.push(child); },
        querySelector(selector) { return this.children.find(child => child.className === selector.slice(1)); },
        querySelectorAll(selector) { return this.children.filter(child => child.className === selector.slice(1)); }
    };
    const context = vm.createContext({
        window: { matchMedia: () => ({ matches: reduced }) },
        document: { getElementById: () => result, createElement: element }
    });
    vm.runInContext('let latestResultText = ""; let resultHidden = false;\n' + source.slice(source.indexOf('function clearResultMotion()'), source.indexOf('function showResultConfirm()')), context);
    return { result, context };
}
test('directional trail strength decreases without blurring the result', () => {
    const { result, context } = setup();
    context.setResultText('牛肉面', true, 80, { strength: 1 });
    assert.equal(result.children[0].style.getPropertyValue('--trail-alpha'), '0.300');
    context.setResultText('米饭', true, 180, { strength: 0.2 });
    assert.equal(result.children.length, 1, 'moving candidate must not restart from the center as an outgoing clone');
    assert.equal(result.children[0].style.getPropertyValue('--trail-alpha'), '0.060');
    assert.equal(result.children[0].style.filter, undefined);
});
test('final result is sharp and cancellation removes all transient state', () => {
    const { result, context } = setup();
    context.setResultText('面条', true, 80);
    context.setResultText('米饭', true, 320, { settle: true, strength: 0 });
    const final = result.children[0];
    assert.ok(final.classList.contains('settling'));
    assert.equal(final.style.getPropertyValue('--trail-alpha'), '0.000');
    context.clearResultMotion();
    assert.equal(result.children.length, 1);
    assert.ok(!final.classList.contains('settling'));
    assert.equal(final.style.getPropertyValue('--trail-alpha'), '');
});
test('ordinary candidates move monotonically upward over the whole interval', () => {
    const css = fs.readFileSync(require.resolve('../assets/app/style.css'), 'utf8');
    const keyframes = css.slice(css.indexOf('@keyframes result-roll-up'), css.indexOf('.result .result-exit'));
    assert.match(keyframes, /50%[\s\S]*translateY\(0\)/);
    assert.match(keyframes, /to\s*\{[\s\S]*translateY\(calc\(-1 \* var\(--roll-distance/);
    assert.doesNotMatch(keyframes, /translateY\(-3px\)/);
    assert.match(source, /setResultText\(getItemDisplay\(picked.item\), true, delay, \{ reel: true, strength, nextText \}\)/);
    assert.match(source, /reel: true, settle: true/);
});
test('display random selection avoids adjacent duplicates without using draw weights', () => {
    const { context } = setup();
    for (let index = 0; index < 30; index++) {
        assert.equal(context.randomReelItem(['A', 'B'], ['A']), 'B');
        assert.equal(context.randomReelItem(['A', 'B', 'C'], ['A', 'B']), 'C');
        assert.equal(context.randomReelItem(['A'], ['A']), 'A');
    }
    assert.equal(context.randomReelItem([]), '');
});
test('reduced motion uses a single static text node', () => {
    const { result, context } = setup(true);
    context.setResultText('面条', true, 80);
    context.setResultText('米饭', true, 320, { settle: true, strength: 0 });
    assert.equal(result.children.length, 1);
    assert.equal(result.children[0].textContent, '米饭');
    assert.ok(!result.children[0].classList.contains('settling'));
    assert.ok(!result.children[0].classList.contains('rolling'));
});
