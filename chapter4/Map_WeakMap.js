const map = new Map();
const weakMap = new WeakMap();

let foo = { foo: 1 };
let bar = { bar: 2 };
map.set(foo, 1);
weakMap.set(bar, 2);

foo = null;
bar = null;

console.log(map);
console.log(weakMap);
