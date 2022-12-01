const workercode = () => {
  const config = {
    duration: 0,
    interval: 0,
  };
  self.onmessage = function (e) {
    if (e.data.config) {
      Object.assign(config, e.data.config);
      return;
    }
    if (!e.data.script) return;
    self.postMessage("start");
    var count = 0;
    var now = Date.now();
    var end = now + config.duration;
    var tick = now + config.interval;
    var fn = new Function(e.data.script);
    while (Date.now() < end) {
      count++;
      if (Date.now() > tick) {
        self.postMessage(count);
        tick = Date.now() + config.interval;
      }
      fn();
    }
    self.postMessage("end");
  };
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

module.exports = worker_script;
