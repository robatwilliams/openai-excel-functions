/**
 * Limits the number of concurrent requests to the API.
 *
 * 1. Prevents flooding the API when full recalculation occurs in a sheet with
 *      many completion cells (e.g. when opening the workbook).
 * 2. Gives the user a chance to cancel mass recalculation (e.g. by undo or
 *      delete) before all the requests are dispatched.
 */
export default class ConcurrencyLimitedFetch {
  /**
   * High enough to be unnoticeable for small scenarios, and to complete large
   *   scenarios in reasonable time.
   * Low enough to avoid incurring excessive costs before the user has a chance
   *   to cancel, even for large model input/output sizes.
   *
   * Keep the readme in sync with this behaviour and chosen limit.
   */
  static _PENDING_LIMIT = 10;

  _queue = [];
  _pendingCount = 0;

  fetch(resource, options) {
    const promise = new Promise((resolve, reject) => {
      const task = {
        args: { resource, options },
        resolve,
        reject,
      };
      this._queue.push(task);
    });

    this._process();

    return promise;
  }

  _process() {
    if (
      this._queue.length === 0 ||
      this._pendingCount >= ConcurrencyLimitedFetch._PENDING_LIMIT
    ) {
      return;
    }

    const task = this._queue.shift();

    if (task.args.options.signal.aborted) {
      task.reject(task.args.options.signal.reason);
      return;
    }

    this._pendingCount++;
    const promise = fetch(task.args.resource, task.args.options);

    promise.then(task.resolve, task.reject);
    promise.finally(() => {
      this._pendingCount--;
      this._process();
    });
  }
}
