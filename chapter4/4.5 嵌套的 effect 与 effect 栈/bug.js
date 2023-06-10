const bucket = new WeakMap();
let activeEffect;

const data = { foo: true, bar: true };
let temp1, temp2;

const obj = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        trigger(target, key);
        return true;
    },
});

function track(target, key) {
    if (!activeEffect) return;
    let depsMap = bucket.get(target);
    if (!depsMap) bucket.set(target, (depsMap = new Map()));
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, (deps = new Set()));
    if (!deps.has(activeEffect)) {
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}

function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    const effectsToRun = new Set(effects);
    effectsToRun.forEach((fn) => fn());
}

function effect(fn) {
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn;
        fn();
    };
    effectFn.deps = [];
    effectFn();
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}

debugger
effect(function effectFn1() {
    console.log("effectFn1 run");
    effect(function effectFn2() {
        console.log("effectFn2 run");
        temp2 = obj.bar;
    });
    temp1 = obj.foo;
});

setTimeout(() => {
    obj.foo = false;
}, 1000);

// effectFn1 run
// effectFn2 run
// effectFn2 run
