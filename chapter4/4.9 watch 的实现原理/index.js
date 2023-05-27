const bucket = new WeakMap();

const data = { foo: 1 };
let activeEffect;
const effectStack = [];

function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(activeEffect);
        const res = fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    };
    effectFn.options = options;
    effectFn.deps = [];
    if (!options.lazy) {
        effectFn();
    }
    return effectFn;
}

function computed(getter) {
    let value;
    let dirty = true;
    const effectFn = effect(getter, {
        lazy: true,
        scheduler: () => {
            dirty = true;
            trigger(obj, "value");
        },
    });

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            track(obj, "value");
            return value;
        },
    };
    return obj;
}

function watch(source, cb) {
    let getter;
    if (typeof source === "function") {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    let oldValue, newValue;
    const effectFn = effect(() => getter(), {
        lazy: true,
        scheduler() {
            newValue = effectFn();
            console.log("####");
            console.log(oldValue);
            console.log(newValue);
            cb(newValue, oldValue);
            oldValue = newValue;
        },
    });
    oldValue = effectFn();
}

function traverse(value, seen = new Set()) {
    if (typeof value !== "object" || value === null || seen.has(value)) return;
    seen.add(value);
    for (const k in value) {
        traverse(value[k], seen);
    }
    return value;
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
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

watch(obj, (newValue, oldValue) => {
    console.log("数据变化了");
    console.log(oldValue);
    console.log(newValue);
});

watch(
    () => obj.foo,
    (newValue, oldValue) => {
        console.log("数据变化了");
        console.log(oldValue);
        console.log(newValue);
    }
);

obj.foo++;

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
    activeEffect.deps.push(deps);
}

function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);
    const effectsToRun = new Set();
    effects &&
        effects.forEach((effectFn) => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn);
            }
        });
    effectsToRun.forEach((effectFn) => {
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
}
