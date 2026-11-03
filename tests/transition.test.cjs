const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/app/app.js'), 'utf8');
const start = source.indexOf('const PAGE_SWITCH_OUT_MS');
const end = source.indexOf('function transitionToTeachingMode()', start);

function setup(reduced = false) {
    const classes = new Set();
    const listeners = new Set();
    const timers = new Map();
    let nextTimer = 0;
    const panel = {
        addEventListener: (_, handler) => listeners.add(handler),
        removeEventListener: (_, handler) => listeners.delete(handler)
    };
    const context = vm.createContext({
        document: {
            body: { classList: { add: (...args) => args.forEach(c => classes.add(c)), remove: (...args) => args.forEach(c => classes.delete(c)) } },
            getElementById: () => panel
        },
        window: { matchMedia: () => ({ matches: reduced }) },
        setTimeout: (handler, ms) => { timers.set(++nextTimer, { handler, ms }); return nextTimer; },
        clearTimeout: id => timers.delete(id)
    });
    vm.runInContext(source.slice(start, end), context);
    const emit = (name, target = panel) => [...listeners].forEach(handler => handler({ animationName: name, target }));
    return { context, classes, timers, emit };
}

test('page transition waits for real animation ends, ignores bubbling child effects', () => {
    const env = setup();
    let applied = 0;
    env.context.runPageSwitch('page-to-home-out', 'page-home-in', () => applied++);
    assert.ok(env.classes.has('page-to-home-out'));
    assert.equal(applied, 0);
    assert.equal([...env.timers.values()][0].ms, 1180);
    env.emit('page-slide-out-right', {});
    env.emit('teaching-card-flash');
    assert.equal(applied, 0);
    env.emit('page-slide-out-right');
    assert.equal(applied, 1);
    assert.ok(env.classes.has('page-home-in'));
    assert.ok(!env.classes.has('page-to-home-out'));
    assert.equal([...env.timers.values()][0].ms, 1280);
    env.emit('page-slide-in-left', {});
    assert.ok(env.classes.has('page-home-in'));
    env.emit('page-slide-in-left');
    assert.equal(env.classes.size, 0);
    assert.equal(env.timers.size, 0);
});
test('reduced motion changes page immediately without timers', () => {
    const env = setup(true);
    let applied = false;
    env.context.runPageSwitch('page-to-home-out', 'page-home-in', () => { applied = true; });
    assert.ok(applied);
    assert.equal(env.classes.size, 0);
    assert.equal(env.timers.size, 0);
});
test('missing animation events have a fallback and do not leave the UI locked', () => {
    const env = setup();
    let applied = 0;
    env.context.runPageSwitch('page-to-home-out', 'page-home-in', () => applied++);
    [...env.timers.values()][0].handler();
    assert.equal(applied, 1);
    [...env.timers.values()][0].handler();
    assert.equal(env.classes.size, 0);
    assert.equal(env.timers.size, 0);
});
