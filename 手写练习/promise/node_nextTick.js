new Promise(res => res()).then(() => {
  console.log("e");
  process.nextTick(() => {
    console.log("f");
  });
  new Promise(r => {
    r()
  })
    .then(() => {
      console.log("g");
    });
  setTimeout(() => {
    console.log("h");
  });
});