const bucket = new WeakMap();
let activeEffect;

const data = { ok: true, text: "hello world" };

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

function effect(fn) {
    activeEffect = fn;
    fn();
}

function track(target, key) {
    if (!activeEffect) return;
    let depsMap = bucket.get(target);
    if (!depsMap) bucket.set(target, (depsMap = new Map()));
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, (deps = new Set()));
    deps.add(activeEffect);
}

function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    effects && effects.forEach((fn) => fn());
}

effect(() => {
    console.log("effect run");
    document.body.innerText = obj.ok ? obj.text : "not";
});

setTimeout(() => {
    obj.ok = false;
}, 1000);

setTimeout(() => {
    obj.text = "hello vue3";
}, 2000);
// 当 obj.ok为false时，理想中修改obj.text不应该再触发依赖函数的执行，但目前实际并非如此。
