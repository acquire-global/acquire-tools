'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import {
	Alert,
	Box,
	Button,
	Chip,
	Container,
	LinearProgress,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import InputFileUpload from '@/components/InputFileUpload'

type EntryType = 'directory' | 'file' | 'other'

type FtpEntry = {
	name: string
	path: string
	type: EntryType
	size: number
	modifiedAt?: string
	resolvedUrl?: string
}

type Breadcrumb = {
	name: string
	path: string
}

type BrowseResponse = {
	path: string
	parentPath: string | null
	breadcrumbs: Breadcrumb[]
	resolvedDirectoryUrl: string
	entries: FtpEntry[]
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

type UploadResponse = {
	path: string
	resolvedDirectoryUrl: string
	uploaded: UploadedFile[]
	failed: UploadFailure[]
}

type ApiErrorPayload = {
	message?: string
	error?: string
}

function formatSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return '-'
	}

	if (bytes === 0) {
		return '0 B'
	}

	const units = ['B', 'KB', 'MB', 'GB']
	const power = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	)
	const value = bytes / 1024 ** power
	return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`
}

export default function Page() {
	const [pathInput, setPathInput] = useState('/static')
	const [browseData, setBrowseData] = useState<BrowseResponse | null>(null)
	const [isBrowsing, setIsBrowsing] = useState(false)
	const [browseError, setBrowseError] = useState<string | null>(null)

	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [uploadMessage, setUploadMessage] = useState<string | null>(null)
	const [uploadResults, setUploadResults] = useState<UploadedFile[]>([])
	const [uploadFailures, setUploadFailures] = useState<UploadFailure[]>([])

	const effectivePath = useMemo(
		() => browseData?.path ?? (pathInput.trim() || '/static'),
		[browseData?.path, pathInput],
	)

	const getApiErrorMessage = (payload: unknown, fallback: string): string => {
		if (payload && typeof payload === 'object') {
			const maybeError = payload as ApiErrorPayload
			if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
				return maybeError.error
			}

			if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
				return maybeError.message
			}
		}

		return fallback
	}

	const browsePath = async (requestedPath?: string) => {
		setIsBrowsing(true)
		setBrowseError(null)

		const targetPath = (requestedPath ?? pathInput).trim() || '/static'

		try {
			const response = await fetch(
				`/api/ftp-uploader?path=${encodeURIComponent(targetPath)}`,
				{ method: 'GET' },
			)

			const payload = (await response.json()) as
				| BrowseResponse
				| ApiErrorPayload

			if (!response.ok) {
				throw new Error(
					getApiErrorMessage(payload, 'Unable to browse FTP path.'),
				)
			}

			const data = payload as BrowseResponse
			setBrowseData(data)
			setPathInput(data.path)
		} catch (error) {
			setBrowseError(
				error instanceof Error ? error.message : 'FTP browse failed.',
			)
		} finally {
			setIsBrowsing(false)
		}
	}

	const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? [])
		setSelectedFiles(files)
		setUploadError(null)
		setUploadMessage(null)
		event.target.value = ''
	}

	const uploadFiles = async () => {
		if (!selectedFiles.length) {
			setUploadError('Select one or more files before uploading.')
			return
		}

		setIsUploading(true)
		setUploadError(null)
		setUploadMessage(null)
		setUploadResults([])
		setUploadFailures([])

		try {
			const formData = new FormData()
			formData.append('path', effectivePath)

			for (const file of selectedFiles) {
				formData.append('files', file)
			}

			const response = await fetch('/api/ftp-uploader', {
				method: 'POST',
				body: formData,
			})

			const payload = (await response.json()) as
				| UploadResponse
				| ApiErrorPayload

			if (!response.ok && response.status !== 207) {
				throw new Error(getApiErrorMessage(payload, 'FTP upload failed.'))
			}

			const uploadData = payload as UploadResponse
			setUploadResults(uploadData.uploaded)
			setUploadFailures(uploadData.failed)

			const successCount = uploadData.uploaded.length
			const failureCount = uploadData.failed.length

			if (failureCount === 0) {
				setUploadMessage(
					`Uploaded ${successCount} file${successCount === 1 ? '' : 's'} to ${uploadData.path}.`,
				)
			} else {
				setUploadMessage(
					`Uploaded ${successCount} file${successCount === 1 ? '' : 's'} with ${failureCount} failure${failureCount === 1 ? '' : 's'}.`,
				)
			}

			setSelectedFiles([])
			await browsePath(uploadData.path)
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : 'FTP upload failed.',
			)
		} finally {
			setIsUploading(false)
		}
	}

	return (
		<Container maxWidth='lg'>
			<Stack spacing={3} marginTop={3} marginBottom={3}>
				<Typography variant='h3'>FTP File Uploader</Typography>
				<Typography variant='body1'>
					Browse the Acquire FTP server, upload files, and copy fully resolved
					asite.io URLs.
				</Typography>

				<Paper sx={{ padding: 3 }}>
					<Stack spacing={2}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
							<TextField
								label='FTP path'
								value={pathInput}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									setPathInput(event.target.value)
								}
								placeholder='/static/promos/2683'
								fullWidth
								disabled={isBrowsing || isUploading}
							/>
							<Button
								variant='contained'
								onClick={() => {
									void browsePath()
								}}
								disabled={isBrowsing || isUploading}>
								Browse
							</Button>
						</Stack>

						{isBrowsing && <LinearProgress />}
						{browseError && <Alert severity='error'>{browseError}</Alert>}

						{browseData && (
							<Stack spacing={1}>
								<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
									{browseData.breadcrumbs.map((crumb) => (
										<Chip
											key={crumb.path}
											label={crumb.name}
											onClick={() => {
												void browsePath(crumb.path)
											}}
											clickable
										/>
									))}
								</Stack>

								<Typography variant='body2'>
									Resolved folder URL: {browseData.resolvedDirectoryUrl}
								</Typography>

								{browseData.parentPath && (
									<Button
										variant='outlined'
										onClick={() => {
											void browsePath(browseData.parentPath ?? '/static')
										}}
										disabled={isBrowsing || isUploading}>
										Go to parent
									</Button>
								)}
							</Stack>
						)}
					</Stack>
				</Paper>

				<Paper sx={{ padding: 3 }}>
					<Stack spacing={2}>
						<Typography variant='h6'>Upload files to current path</Typography>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
							<InputFileUpload
								onChange={handleUploadChange}
								multiple
								label='Select files'
							/>
							<Button
								variant='outlined'
								onClick={() => {
									setSelectedFiles([])
								}}
								disabled={isUploading}>
								Clear
							</Button>
							<Button
								variant='contained'
								onClick={() => {
									void uploadFiles()
								}}
								disabled={isUploading || !selectedFiles.length}>
								{isUploading ? 'Uploading...' : 'Upload'}
							</Button>
						</Stack>

						<Typography variant='body2'>
							Upload destination: {effectivePath}
						</Typography>
						<Typography variant='body2'>
							Selected files: {selectedFiles.length}
						</Typography>

						{uploadError && <Alert severity='error'>{uploadError}</Alert>}
						{uploadMessage && <Alert severity='success'>{uploadMessage}</Alert>}
					</Stack>
				</Paper>

				{browseData && (
					<Paper sx={{ padding: 2 }}>
						<Typography variant='h6' marginBottom={2}>
							Directory listing ({browseData.entries.length})
						</Typography>
						<Box sx={{ maxHeight: 420, overflow: 'auto' }}>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>Name</TableCell>
										<TableCell>Type</TableCell>
										<TableCell>Size</TableCell>
										<TableCell>Resolved URL</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{browseData.entries.map((entry) => (
										<TableRow key={entry.path}>
											<TableCell>
												{entry.type === 'directory' ? (
													<Button
														variant='text'
														onClick={() => {
															void browsePath(entry.path)
														}}
														disabled={isBrowsing || isUploading}>
														{entry.name}
													</Button>
												) : (
													entry.name
												)}
											</TableCell>
											<TableCell>{entry.type}</TableCell>
											<TableCell>
												{entry.type === 'file' ? formatSize(entry.size) : '-'}
											</TableCell>
											<TableCell>
												{entry.resolvedUrl ? (
													<a
														href={entry.resolvedUrl}
														target='_blank'
														rel='noreferrer'>
														{entry.resolvedUrl}
													</a>
												) : (
													'-'
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Paper>
				)}

				{uploadResults.length > 0 && (
					<Paper sx={{ padding: 2 }}>
						<Typography variant='h6' marginBottom={2}>
							Uploaded files ({uploadResults.length})
						</Typography>
						<Box sx={{ maxHeight: 360, overflow: 'auto' }}>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>File</TableCell>
										<TableCell>FTP path</TableCell>
										<TableCell>Resolved URL</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{uploadResults.map((item) => (
										<TableRow key={item.ftpPath}>
											<TableCell>{item.fileName}</TableCell>
											<TableCell>{item.ftpPath}</TableCell>
											<TableCell>
												<a
													href={item.resolvedUrl}
													target='_blank'
													rel='noreferrer'>
													{item.resolvedUrl}
												</a>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Paper>
				)}

				{uploadFailures.length > 0 && (
					<Paper sx={{ padding: 2 }}>
						<Typography variant='h6' marginBottom={2}>
							Upload failures ({uploadFailures.length})
						</Typography>
						<Box sx={{ maxHeight: 260, overflow: 'auto' }}>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>File</TableCell>
										<TableCell>Error</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{uploadFailures.map((failure, index) => (
										<TableRow key={`${failure.fileName}-${index}`}>
											<TableCell>{failure.fileName}</TableCell>
											<TableCell>{failure.error}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					</Paper>
				)}
			</Stack>
		</Container>
	)
}
