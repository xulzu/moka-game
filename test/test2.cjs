const obj = {
  fn() {
    throw "2";
  },
};

setInterval(() => {
  console.log(3);
  obj.fn();
}, 1000);
