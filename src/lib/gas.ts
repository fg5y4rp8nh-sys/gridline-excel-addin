// Promise wrapper around google.script.run, so the sidebar can await server functions in Code.gs.
type Runner = Record<string, (...a: unknown[]) => void> & {
  withSuccessHandler(f: (v: unknown) => void): Runner;
  withFailureHandler(f: (e: Error) => void): Runner;
};
declare const google: { script: { run: Runner; host: { close(): void } } };

export function call<T>(fn: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    google.script.run.withSuccessHandler(v => resolve(v as T)).withFailureHandler(reject)[fn](...args);
  });
}
