import type { UserConfig } from 'tsdown'

const PLUGIN_ID = 'dsh-ventus-research'

/** 平台模块（loader 模块表可应答）：react 全家桶 + @deepseek-ai/* 平台包。 */
const CLIENT_EXTERNALS = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/*',
]

/** 判断模块是否应 external（平台模块运行时由 loader 提供，不可内联）。 */
function isExternal(id: string): boolean {
  return CLIENT_EXTERNALS.some(ext => ext.endsWith('/*') ? id.startsWith(ext.slice(0, -1)) : id === ext)
}

const clientBundle: UserConfig = {
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: isExternal,
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(PLUGIN_ID) + ', factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    codeSplitting: false,
  },
}

export default [clientBundle] satisfies UserConfig[]
