import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';

let startNCount = 10;

const performCalculations = async () => {
  const cpuCoresCount = availableParallelism();
  const workersPromises = [];

  const currentDirname = import.meta.dirname;

  for (let i = 0; i < cpuCoresCount; i += 1) {
    const workerPromise = new Promise((resolve, reject) => {
      const newWorker = new Worker(`${currentDirname}/worker.js`, {
        workerData: { n: startNCount + i },
      });

      newWorker.on('message', (message) => {
        if (message?.data !== null) {
          resolve({ status: 'resolved', data: message.data });
        }
      });

      newWorker.on('error', (err) => {
        reject(err);
      });

      newWorker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });

    workersPromises.push(workerPromise);
  }

  const workersResults = await Promise.allSettled(workersPromises);

  console.debug(
    workersResults.map((promiseResult) => {
      if (promiseResult.status === 'rejected') {
        return {
          status: 'error',
          data: null,
        };
      }

      return promiseResult.value;
    }),
  );
};

await performCalculations();
