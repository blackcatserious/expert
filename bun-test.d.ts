declare module 'bun:test' {
  export const describe: (...args: any[]) => void
  export const it: (...args: any[]) => void
  export const expect: (...args: any[]) => any
  export const beforeAll: (...args: any[]) => void
  export const afterEach: (...args: any[]) => void
  export const mock: {
    module: (specifier: string, factory: () => Record<string, unknown>) => void
  }
}
