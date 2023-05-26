const bucket = new WeakMap();

const data = { text: "hello world" };
let activeEffect;

function effect(fn) {
    activeEffect = fn;
    fn();
}

const obj = new Proxy(data, {
    get(target, key) {
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
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        const depsMap = bucket.get(target);
        if (!depsMap) return;
        const effects = depsMap.get(key);
        effects && effects.forEach((effect) => effect());
    },
});

effect(() => {
    console.log("effect run");
    document.body.innerText = obj.text;
});

setTimeout(() => {
    // obj.noExist = "hello, vue3";
    obj.text = "hello, vue3";
}, 1000);
