const set = new Set([1]);

set.forEach((item) => {
    set.delete(1);
    // set.add(1); // 死循环
    set.add(2); // 不会死循环
    console.log("遍历中");
});
