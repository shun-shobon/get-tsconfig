import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

function findConfigFile(searchPath, configName) {
  while (true) {
    const configPath = path.join(searchPath, configName);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    const parentPath = path.dirname(searchPath);
    if (parentPath === searchPath) {
      return;
    }
    searchPath = parentPath;
  }
}

var require$1 = (
			true
				? createRequire(import.meta.url)
				: require
		);

const indirectEval = eval;
const safeEval = (expression) => indirectEval(`const emptyGlobal = new Proxy({}, { has: () => true });with (emptyGlobal) { (${expression}
) }`);

const normalizePath = (filePath) => /^[./]/.test(filePath) ? filePath : `./${filePath}`;

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function readTsconfig(filePath) {
  const fileRealPath = fs.realpathSync(filePath);
  const directoryPath = path.dirname(fileRealPath);
  const fileContent = fs.readFileSync(filePath, "utf8").trim();
  let config = {};
  if (fileContent) {
    try {
      config = safeEval(fileContent);
    } catch {
      throw new SyntaxError(`Failed to parse JSON: ${filePath}`);
    }
  }
  if (config.extends) {
    let extendsPath = config.extends;
    try {
      extendsPath = require$1.resolve(extendsPath, { paths: [path.dirname(filePath)] });
    } catch (error) {
      if (error.code === "MODULE_NOT_FOUND") {
        try {
          extendsPath = require$1.resolve(path.join(extendsPath, "tsconfig.json"), { paths: [path.dirname(filePath)] });
        } catch {
        }
      }
    }
    const extendsConfig = readTsconfig(extendsPath);
    delete extendsConfig.references;
    if (extendsConfig.compilerOptions?.baseUrl) {
      const { compilerOptions } = extendsConfig;
      compilerOptions.baseUrl = path.relative(directoryPath, path.join(path.dirname(extendsPath), compilerOptions.baseUrl));
    }
    if (extendsConfig.files) {
      extendsConfig.files = extendsConfig.files.map((file) => path.relative(directoryPath, path.join(path.dirname(extendsPath), file)));
    }
    if (extendsConfig.include) {
      extendsConfig.include = extendsConfig.include.map((file) => path.relative(directoryPath, path.join(path.dirname(extendsPath), file)));
    }
    delete config.extends;
    const merged = __spreadProps(__spreadValues(__spreadValues({}, extendsConfig), config), {
      compilerOptions: __spreadValues(__spreadValues({}, extendsConfig.compilerOptions), config.compilerOptions)
    });
    if (extendsConfig.watchOptions) {
      merged.watchOptions = __spreadValues(__spreadValues({}, extendsConfig.watchOptions), config.watchOptions);
    }
    config = merged;
  }
  if (config.compilerOptions?.baseUrl) {
    const { compilerOptions } = config;
    compilerOptions.baseUrl = normalizePath(compilerOptions.baseUrl);
  }
  if (config.files) {
    config.files = config.files.map(normalizePath);
  }
  if (config.watchOptions) {
    const { watchOptions } = config;
    if (watchOptions.excludeDirectories) {
      watchOptions.excludeDirectories = watchOptions.excludeDirectories.map((excludePath) => path.resolve(directoryPath, excludePath));
    }
  }
  return config;
}

function getTsconfig(searchPath = process.cwd(), configName = "tsconfig.json") {
  const configFile = findConfigFile(searchPath, configName);
  if (!configFile) {
    return null;
  }
  const config = readTsconfig(configFile);
  return {
    path: configFile,
    config
  };
}

export { getTsconfig as default };
