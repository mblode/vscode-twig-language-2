"use strict";
const { Worker } = require("node:worker_threads");

function runFormatter(
  workerPath,
  source,
  options,
  range,
  cancellation,
  timeout = 5000,
) {
  if (cancellation?.isCancellationRequested)
    return { promise: Promise.resolve([]), dispose() {} };
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024) {
    return {
      promise: Promise.reject(
        new Error("Document exceeds the 2 MiB formatting limit"),
      ),
      dispose() {},
    };
  }
  const worker = new Worker(workerPath, {
    workerData: { source, options, range },
  });
  let settled = false,
    timer,
    subscription,
    finish;
  const promise = new Promise((resolve, reject) => {
    finish = (error, edits = []) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.dispose();
      void worker.terminate();
      if (error) reject(error);
      else resolve(edits);
    };
    worker.once("message", (result) =>
      finish(result.error ? new Error(result.error) : null, result.edits),
    );
    worker.once("error", (error) => finish(error));
    worker.once("exit", (code) => {
      if (!settled)
        finish(
          new Error(`Formatter worker exited before returning edits (${code})`),
        );
    });
    timer = setTimeout(
      () => finish(new Error(`Formatting exceeded ${timeout} ms`)),
      timeout,
    );
    subscription = cancellation?.onCancellationRequested(() => finish(null));
    if (cancellation?.isCancellationRequested) finish(null);
  });
  return {
    promise,
    dispose() {
      finish(null);
    },
  };
}
module.exports = { runFormatter };
