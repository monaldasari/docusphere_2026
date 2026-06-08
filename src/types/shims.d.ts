// Project-level shims to silence mismatched/compiled package typings.

declare module 'react-server-dom-webpack/server.edge' {
  export function renderToReadableStream(...args: any[]): any;
  export const decodeReply: any;
  export const decodeAction: any;
  export const decodeFormState: any;
}

declare module 'react-server-dom-webpack' {
  const anything: any;
  export = anything;
}

declare module 'VAR_MODULE_GLOBAL_ERROR' {
  const _default: any;
  export default _default;
}

declare module 'next/dist/compiled/webpack/webpack' {
  const _webpack: any;
  export default _webpack;
  export namespace webpack {
    type RuleSetUseItem = any;
    type DefinePlugin = any;
    interface Configuration { [key: string]: any }
  }
}

// Fallback for any other compiled-next internal modules that may be missing
declare module 'next/dist/compiled/*' {
  const whatever: any;
  export = whatever;
}

// Generic shim for unexpected modules referenced by declaration files
declare module '*-edge' {
  const anything: any;
  export default anything;
}
