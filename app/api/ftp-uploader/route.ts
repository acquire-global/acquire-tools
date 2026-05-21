import { NextResponse } from 'next/server'
import { Client } from 'basic-ftp'
import { Readable } from 'stream'
import path from 'path'

export const runtime = 'nodejs'

type ListedEntry = {
	name: string
	path: string
	type: 'directory' | 'file' | 'other'
	size: number
	modifiedAt?: string
	resolvedUrl?: string
}

type Breadcrumb = {
	name: string
	path: string
}

type UploadedFile = {
	fileName: string
	ftpPath: string
	resolvedUrl: string
	size: number
}

type UploadFailure = {
	fileName: string
	error: string
}

type FtpSecureMode = 'off' | 'explicit' | 'implicit'

function normalizeFtpPath(input: string | null | undefined): string {
	const raw = (input ?? '/').replace(/\\/g, '/').trim()
	const normalized = path.posix.normalize(raw.startsWith('/') ? raw : `/${raw}`)

	if (normalized === '.' || normalized === '') {
		return '/'
	}

	if (normalized.length > 1 && normalized.endsWith('/')) {
		return normalized.slice(0, -1)
	}

	return normalized
}

function getParentPath(ftpPath: string): string | null {
	if (ftpPath === '/') {
		return null
	}

	const parent = path.posix.dirname(ftpPath)
	return parent === '.' ? '/' : parent
}

function getBreadcrumbs(ftpPath: string): Breadcrumb[] {
	const normalizedPath = normalizeFtpPath(ftpPath)
	const segments = normalizedPath.split('/').filter(Boolean)
	const breadcrumbs: Breadcrumb[] = [{ name: '/', path: '/' }]

	let currentPath = ''
	for (const segment of segments) {
		currentPath = `${currentPath}/${segment}`
		breadcrumbs.push({
			name: segment,
			path: normalizeFtpPath(currentPath),
		})
	}

	return breadcrumbs
}

function getAsiteOrigin(): string {
	return (process.env.ASITE_ORIGIN ?? 'https://asite.io').replace(/\/+$/, '')
}

function getFtpPublicPrefix(): string {
	return normalizeFtpPath(process.env.FTP_PUBLIC_PREFIX ?? '/static')
}

function getAsitePublicPrefix(): string {
	return normalizeFtpPath(process.env.ASITE_PUBLIC_PREFIX ?? '/s')
}

function resolveAsiteUrlForPath(ftpPath: string): string {
	const normalizedFtpPath = normalizeFtpPath(ftpPath)
	const ftpPublicPrefix = getFtpPublicPrefix()
	const asitePublicPrefix = getAsitePublicPrefix()

	let relativePath = normalizedFtpPath
	if (
		normalizedFtpPath === ftpPublicPrefix ||
		normalizedFtpPath.startsWith(`${ftpPublicPrefix}/`)
	) {
		relativePath = normalizedFtpPath.slice(ftpPublicPrefix.length) || '/'
	}

	const normalizedRelative =
		relativePath === '/' ? '' : relativePath.replace(/^\/+/, '')

	const finalPath = normalizedRelative
		? `${asitePublicPrefix}/${normalizedRelative}`
		: asitePublicPrefix

	return `${getAsiteOrigin()}${finalPath}`
}

function resolveAsiteUrlForFile(folderPath: string, fileName: string): string {
	const filePath = normalizeFtpPath(`${folderPath}/${fileName}`)
	return resolveAsiteUrlForPath(filePath)
}

function getRequiredEnv(name: string): string {
	const value = process.env[name]
	if (!value || !value.trim()) {
		throw new Error(`Missing required environment variable: ${name}`)
	}

	return value.trim()
}

function parseSecureMode(value: string | undefined): FtpSecureMode {
	if (!value || !value.trim()) {
		return 'off'
	}

	const normalized = value.trim().toLowerCase()

	if (
		normalized === 'implicit' ||
		normalized === 'ftps-implicit' ||
		normalized === 'implicit-tls'
	) {
		return 'implicit'
	}

	if (
		normalized === 'explicit' ||
		normalized === 'ftps' ||
		normalized === 'explicit-tls' ||
		normalized === '1' ||
		normalized === 'true' ||
		normalized === 'yes'
	) {
		return 'explicit'
	}

	return 'off'
}

function resolveFtpPort(
	portValue: string | undefined,
	secureMode: FtpSecureMode,
): number {
	if (!portValue || !portValue.trim()) {
		return secureMode === 'implicit' ? 990 : 21
	}

	const parsedPort = Number(portValue)
	if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
		throw new Error('FTP_PORT must be a positive number.')
	}

	return parsedPort
}

function getSecureOption(secureMode: FtpSecureMode): boolean | 'implicit' {
	if (secureMode === 'implicit') {
		return 'implicit'
	}

	return secureMode === 'explicit'
}

function appendTlsMismatchHint(message: string): string {
	if (!message.toLowerCase().includes('wrong version number')) {
		return message
	}

	return `${message} Check FTP_SECURE_MODE/FTP_SECURE and FTP_PORT: implicit FTPS typically uses port 990, explicit FTPS usually uses port 21.`
}

async function withFtpClient<T>(
	callback: (client: Client) => Promise<T>,
): Promise<T> {
	const host = getRequiredEnv('FTP_HOST')
	const user = getRequiredEnv('FTP_USER')
	const password = getRequiredEnv('FTP_PASSWORD')
	const secureMode = parseSecureMode(
		process.env.FTP_SECURE_MODE ?? process.env.FTP_SECURE,
	)
	const port = resolveFtpPort(process.env.FTP_PORT, secureMode)
	const secure = getSecureOption(secureMode)

	const client = new Client()
	client.ftp.verbose = false

	try {
		await client.access({
			host,
			user,
			password,
			port,
			secure,
		})

		return await callback(client)
	} finally {
		client.close()
	}
}

function getEntryType(entry: unknown): 'directory' | 'file' | 'other' {
	if (!entry || typeof entry !== 'object') {
		return 'other'
	}

	const maybeEntry = entry as {
		type?: number
		isDirectory?: boolean | (() => boolean)
		isFile?: boolean | (() => boolean)
	}

	if (
		typeof maybeEntry.isDirectory === 'function' &&
		maybeEntry.isDirectory()
	) {
		return 'directory'
	}

	if (typeof maybeEntry.isDirectory === 'boolean' && maybeEntry.isDirectory) {
		return 'directory'
	}

	if (typeof maybeEntry.isFile === 'function' && maybeEntry.isFile()) {
		return 'file'
	}

	if (typeof maybeEntry.isFile === 'boolean' && maybeEntry.isFile) {
		return 'file'
	}

	if (maybeEntry.type === 1) {
		return 'file'
	}

	if (maybeEntry.type === 2) {
		return 'directory'
	}

	return 'other'
}

export async function GET(request: Request) {
	const url = new URL(request.url)
	const requestedPath = normalizeFtpPath(
		url.searchParams.get('path') ?? process.env.FTP_DEFAULT_PATH ?? '/static',
	)

	try {
		const payload = await withFtpClient(async (client) => {
			const list = await client.list(requestedPath)

			const entries: ListedEntry[] = list
				.map((entry) => {
					const type = getEntryType(entry)
					const entryPath = normalizeFtpPath(`${requestedPath}/${entry.name}`)

					return {
						name: entry.name,
						path: entryPath,
						type,
						size: typeof entry.size === 'number' ? entry.size : 0,
						modifiedAt:
							entry.modifiedAt instanceof Date
								? entry.modifiedAt.toISOString()
								: undefined,
						resolvedUrl:
							type === 'file'
								? resolveAsiteUrlForPath(entryPath)
								: resolveAsiteUrlForPath(entryPath),
					}
				})
				.sort((a, b) => {
					if (a.type === b.type) {
						return a.name.localeCompare(b.name)
					}

					if (a.type === 'directory') {
						return -1
					}

					if (b.type === 'directory') {
						return 1
					}

					return a.name.localeCompare(b.name)
				})

			return {
				path: requestedPath,
				parentPath: getParentPath(requestedPath),
				breadcrumbs: getBreadcrumbs(requestedPath),
				resolvedDirectoryUrl: resolveAsiteUrlForPath(requestedPath),
				entries,
			}
		})

		return NextResponse.json(payload)
	} catch (error) {
		const message =
			error instanceof Error
				? appendTlsMismatchHint(error.message)
				: 'Unable to browse FTP path.'

		return NextResponse.json(
			{
				message: 'FTP browse request failed.',
				error: message,
			},
			{ status: 500 },
		)
	}
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData()
		const destinationPath = normalizeFtpPath(
			String(formData.get('path') ?? process.env.FTP_DEFAULT_PATH ?? '/static'),
		)

		const files = formData
			.getAll('files')
			.filter((value): value is File => value instanceof File)

		if (!files.length) {
			const maybeSingleFile = formData.get('file')
			if (maybeSingleFile instanceof File) {
				files.push(maybeSingleFile)
			}
		}

		if (!files.length) {
			return NextResponse.json(
				{ message: 'No files were provided for upload.' },
				{ status: 400 },
			)
		}

		const result = await withFtpClient(async (client) => {
			await client.ensureDir(destinationPath)

			const uploaded: UploadedFile[] = []
			const failed: UploadFailure[] = []

			for (const file of files) {
				try {
					const safeName =
						file.name.split('/').pop()?.split('\\').pop() ?? file.name
					const fileBuffer = Buffer.from(await file.arrayBuffer())
					await client.uploadFrom(Readable.from(fileBuffer), safeName)

					uploaded.push({
						fileName: safeName,
						ftpPath: normalizeFtpPath(`${destinationPath}/${safeName}`),
						resolvedUrl: resolveAsiteUrlForFile(destinationPath, safeName),
						size: file.size,
					})
				} catch (error) {
					failed.push({
						fileName: file.name,
						error:
							error instanceof Error ? error.message : 'Unknown upload failure',
					})
				}
			}

			return {
				path: destinationPath,
				resolvedDirectoryUrl: resolveAsiteUrlForPath(destinationPath),
				uploaded,
				failed,
			}
		})

		return NextResponse.json(result, {
			status: result.failed.length ? 207 : 200,
		})
	} catch (error) {
		const message =
			error instanceof Error
				? appendTlsMismatchHint(error.message)
				: 'Unable to upload files to FTP server.'

		return NextResponse.json(
			{
				message: 'FTP upload request failed.',
				error: message,
			},
			{ status: 500 },
		)
	}
}
