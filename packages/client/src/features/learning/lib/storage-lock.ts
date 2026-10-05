/** Keep read-modify-write operations atomic across tabs where Web Locks are supported. */
export function withLearningStorageLock<T>(operation: () => T): Promise<T> {
  if (navigator.locks)
    return navigator.locks
      .request('tangobook-learning-storage', operation)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'SecurityError') return operation();
        throw error;
      });
  try {
    return Promise.resolve(operation());
  } catch (error) {
    return Promise.reject(error);
  }
}
