import fs from 'fs';
import path from 'path';
import { parse } from 'jsonc-parser';
import type { PackageJson } from 'type-fest';

const stripExtensionPattern = /\.([mc]js|jsx?)$/;

type FsAPI = Pick<typeof fs, 'existsSync' | 'readFileSync' | 'statSync'>;

const safeStat = (
	api: FsAPI,
	request: string,
) => (api.existsSync(request) && api.statSync(request));

function tryExtensions(
	request: string,
	api: FsAPI,
	extensions: string[],
) {
	for (const extension of extensions) {
		const checkPath = request + extension;
		if (api.existsSync(checkPath)) {
			return checkPath;
		}
	}
}

function getPackageEntry(
	request: string,
	api: FsAPI,
) {
	const packageJsonPath = `${request}/package.json`;
	if (!api.existsSync(packageJsonPath)) {
		return undefined;
	}

	const packageJsonString = api.readFileSync(packageJsonPath, 'utf8');
	const packageJson = parse(packageJsonString) as PackageJson;

	if (!packageJson || typeof packageJson !== 'object') {
		return undefined;
	}

	return packageJson.main;
}

function resolve(
	request: string,
	api: FsAPI,
	extensions: string[],
	nextGenExtensions: Record<string, string[]>,
): string | undefined {
	let resolved = tryExtensions(request, api, extensions);
	if (resolved) {
		return resolved;
	}

	// If it has .js, strip it off and try again from start
	const hasExtension = request.match(stripExtensionPattern);
	if (hasExtension) {
		resolved = tryExtensions(
			request.slice(0, hasExtension.index),
			api,
			(
				nextGenExtensions[hasExtension[1] as string]
				|| extensions
			),
		);

		if (resolved) {
			return resolved;
		}
	}

	const stat = safeStat(api, request);
	if (stat && stat.isDirectory()) {
		// Check if package.json#main exists
		const hasMain = getPackageEntry(request, api);
		if (hasMain) {
			const mainPath = path.join(request, hasMain);
			const mainStat = safeStat(api, mainPath);
			if (mainStat && mainStat.isFile()) {
				return mainPath;
			}

			resolved = resolve(mainPath, api, extensions, nextGenExtensions);

			if (resolved) {
				return resolved;
			}
		}

		// Fallback if main path doesnt exist
		// Try index.ts, index.tsx
		resolved = tryExtensions(path.join(request, 'index'), api, extensions);

		if (resolved) {
			return resolved;
		}
	}
}

export function tsResolve(
	request: string,
	api: FsAPI = fs,
) {
	// enforce that path is absolute
	// handle bare specifier (node_modules lookup)
	// it's handle a package has a main field that needs to be resolved with js -> tsx

	// Try resolving in TypeScript mode
	let resolved = resolve(
		request,
		api,
		['.ts', '.tsx'],
		{
			mjs: ['.mts'],
			cjs: ['.cts'],
		},
	);
	if (resolved) {
		return resolved;
	}

	// Try resolving in JavaScript mode
	resolved = resolve(
		request,
		api,
		['.js', '.jsx'],
		{
			mjs: ['.mjs'],
			cjs: ['.cjs'],
		},
	);
	if (resolved) {
		return resolved;
	}
}