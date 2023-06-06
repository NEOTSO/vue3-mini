const bucket = new Set();
let activeEffect;

const data = { text: "hello world" };

const obj = new Proxy(data, {
    get(target, key) {
        if (activeEffect) {
            bucket.add(activeEffect);
        }
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        bucket.forEach((fn) => fn());
        return true;
    },
});

function effect(fn) {
    activeEffect = fn;
    fn();
}

effect(() => {
    console.log("effect run");
    document.body.innerText = obj.text;
});

setTimeout(() => {
    // obj.text = "hello vue3";
    obj.noExist = "hello vue3";
}, 1000);
