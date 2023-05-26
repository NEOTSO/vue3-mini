const bucket = new WeakMap();

const data = { ok: true, text: "hello world" };
let activeEffect;

function effect(fn) {
    activeEffect = fn;
    fn();
}

const obj = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        trigger(target, key);
    },
});

effect(() => {
    console.log("effect run");
    document.body.innerText = obj.ok ? obj.text : "not";
});

setTimeout(() => {
    obj.ok = false;
    obj.text = "hello, vue3"; // 理想中不应该再次被触发
}, 1000);

function track(target, key) {
    if (!activeEffect) return target[key];
    let depsMap = bucket.get(target);
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
}

function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    effects && effects.forEach((effect) => effect());
}
