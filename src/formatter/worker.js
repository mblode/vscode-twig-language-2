"use strict";
const { parentPort, workerData } = require("node:worker_threads");
const { formatEdits } = require("./format");
formatEdits(workerData.source, workerData.options, workerData.range).then(
  (edits) => parentPort.postMessage({ edits }),
  (error) => parentPort.postMessage({ error: error.message }),
);
