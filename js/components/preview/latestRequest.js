/** Keeps only the newest asynchronous render eligible to update the UI. */
export function createLatestRequestGate() {
  let currentRequest = 0;

  return {
    begin() {
      const request = ++currentRequest;
      return () => request === currentRequest;
    },
    invalidate() {
      currentRequest += 1;
    },
  };
}
