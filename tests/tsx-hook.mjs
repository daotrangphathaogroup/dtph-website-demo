// Compile JSX for server-render contract tests without adding a browser or test runtime.
import {registerHooks} from 'node:module';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/link' || specifier === 'next/dynamic')
      return next(specifier + '.js', context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of ['.tsx', '.ts'])
        if (existsSync(fileURLToPath(url) + extension))
          return {url: url.href + extension, shortCircuit: true};
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && /\.tsx?$/.test(url))
      return {
        format: 'module',
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
          compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      };
    return next(url, context);
  },
});
