'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	Alert,
	Box,
	Button,
	Container,
	FormControl,
	FormControlLabel,
	InputLabel,
	LinearProgress,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Select,
	Slider,
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

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'
type Orientation = 'landscape' | 'portrait'
type CollectionMode = 'none' | 'existing' | 'new'

type UploadItem = {
	name: string
	status: UploadStatus
	url?: string
	altText?: string
	orientation?: Orientation
	error?: string
}

type CollectionImage = {
	image: string
	description: string
	orientation: Orientation
}

type CollectionOption = {
	id: string
	name: string
	description: string
	imageCount: number
	isUnpublished?: boolean
	viewUrl?: string
}

const MAX_CONCURRENCY = 10

async function detectImageOrientation(file: File): Promise<Orientation> {
	try {
		if (typeof createImageBitmap === 'function') {
			const bitmap = await createImageBitmap(file)
			const orientation: Orientation =
				bitmap.height > bitmap.width ? 'portrait' : 'landscape'
			bitmap.close()
			return orientation
		}
	} catch {
		// Continue to fallback path.
	}

	return await new Promise((resolve) => {
		const objectUrl = URL.createObjectURL(file)
		const image = new Image()

		image.onload = () => {
			const orientation: Orientation =
				image.naturalHeight > image.naturalWidth ? 'portrait' : 'landscape'
			URL.revokeObjectURL(objectUrl)
			resolve(orientation)
		}

		image.onerror = () => {
			URL.revokeObjectURL(objectUrl)
			resolve('landscape')
		}

		image.src = objectUrl
	})
}

export default function Page() {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [folderId, setFolderId] = useState('')
	const [namePrefix, setNamePrefix] = useState('')
	const [titleTemplate, setTitleTemplate] = useState('')
	const [altTextTemplate, setAltTextTemplate] = useState('')
	const [concurrency, setConcurrency] = useState(4)
	const [isUploading, setIsUploading] = useState(false)
	const [results, setResults] = useState<UploadItem[]>([])
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [collectionMode, setCollectionMode] = useState<CollectionMode>('none')
	const [collections, setCollections] = useState<CollectionOption[]>([])
	const [isLoadingCollections, setIsLoadingCollections] = useState(false)
	const [selectedCollectionId, setSelectedCollectionId] = useState('')
	const [newCollectionName, setNewCollectionName] = useState('')
	const [collectionSyncMessage, setCollectionSyncMessage] = useState<
		string | null
	>(null)
	const [collectionSyncUrl, setCollectionSyncUrl] = useState<string | null>(
		null,
	)
	const [collectionSyncError, setCollectionSyncError] = useState<string | null>(
		null,
	)
	const [isSyncingCollection, setIsSyncingCollection] = useState(false)

	const loadCollections = async () => {
		setIsLoadingCollections(true)
		setCollectionSyncError(null)

		try {
			const response = await fetch('/api/builder-image-collections', {
				method: 'GET',
			})

			const payload = await response.json()
			if (!response.ok) {
				throw new Error(
					typeof payload?.message === 'string'
						? payload.message
						: 'Failed to load image collections.',
				)
			}

			const nextCollections = Array.isArray(payload?.collections)
				? (payload.collections as CollectionOption[])
				: []

			setCollections(nextCollections)

			if (
				selectedCollectionId &&
				nextCollections.every(
					(collection) => collection.id !== selectedCollectionId,
				)
			) {
				setSelectedCollectionId('')
			}
		} catch (error) {
			setCollectionSyncError(
				error instanceof Error ? error.message : 'Could not load collections.',
			)
		} finally {
			setIsLoadingCollections(false)
		}
	}

	useEffect(() => {
		void loadCollections()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const processedCount = useMemo(
		() =>
			results.filter(
				(item) => item.status === 'success' || item.status === 'error',
			).length,
		[results],
	)

	const successCount = useMemo(
		() => results.filter((item) => item.status === 'success').length,
		[results],
	)

	const errorCount = useMemo(
		() => results.filter((item) => item.status === 'error').length,
		[results],
	)

	const progressValue = selectedFiles.length
		? (processedCount / selectedFiles.length) * 100
		: 0

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? [])
		setUploadError(null)
		setSelectedFiles(files)
		setResults(
			files.map((file) => ({
				name: file.name,
				status: 'pending',
			})),
		)

		// Allow selecting the same files again in a subsequent upload.
		event.target.value = ''
	}

	const updateResult = (index: number, next: Partial<UploadItem>) => {
		setResults((previous) => {
			if (!previous[index]) {
				return previous
			}

			const updated = [...previous]
			updated[index] = {
				...updated[index],
				...next,
			}
			return updated
		})
	}

	const uploadSingle = async (
		file: File,
		index: number,
	): Promise<CollectionImage> => {
		updateResult(index, {
			status: 'uploading',
			error: undefined,
			url: undefined,
		})

		const formData = new FormData()
		const extensionIndex = file.name.lastIndexOf('.')
		const hasExtension = extensionIndex > 0
		const baseName = hasExtension
			? file.name.slice(0, extensionIndex)
			: file.name
		const extension = hasExtension ? file.name.slice(extensionIndex) : ''
		const uploadName = `${namePrefix}${baseName}${extension}`
		const computedAltText = altTextTemplate.trim()
			? altTextTemplate.replace('{name}', baseName)
			: baseName
		const orientation = await detectImageOrientation(file)

		formData.append('file', file)
		formData.append('name', uploadName)
		formData.append('altText', computedAltText)

		if (folderId.trim()) {
			formData.append('folder', folderId.trim())
		}

		if (titleTemplate.trim()) {
			formData.append('title', titleTemplate.replace('{name}', baseName))
		}

		const response = await fetch('/api/builder-upload', {
			method: 'POST',
			body: formData,
		})

		const payload = await response.json()

		if (!response.ok) {
			throw new Error(
				typeof payload?.message === 'string'
					? payload.message
					: 'Upload failed with an unknown error.',
			)
		}

		const builderResponse = payload?.builderResponse as
			| { url?: string }
			| undefined
		const uploadedUrl =
			typeof builderResponse?.url === 'string' ? builderResponse.url : ''

		if (!uploadedUrl) {
			throw new Error('Builder upload completed but no URL was returned.')
		}

		updateResult(index, {
			status: 'success',
			url: uploadedUrl,
			altText: computedAltText,
			orientation,
		})

		return {
			image: uploadedUrl,
			description: computedAltText,
			orientation,
		}
	}

	const syncCollection = async (images: CollectionImage[]) => {
		if (collectionMode === 'none' || !images.length) {
			return
		}

		if (collectionMode === 'existing' && !selectedCollectionId) {
			throw new Error('Select an existing image collection before uploading.')
		}

		if (collectionMode === 'new' && !newCollectionName.trim()) {
			throw new Error(
				'Enter a name for the new image collection before uploading.',
			)
		}

		setIsSyncingCollection(true)
		setCollectionSyncError(null)
		setCollectionSyncMessage(null)
		setCollectionSyncUrl(null)

		const response = await fetch('/api/builder-image-collections', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(
				collectionMode === 'new'
					? {
							action: 'create',
							collectionName: newCollectionName.trim(),
							images,
						}
					: {
							action: 'append',
							collectionId: selectedCollectionId,
							images,
						},
			),
		})

		const payload = await response.json()
		if (!response.ok) {
			throw new Error(
				typeof payload?.message === 'string'
					? payload.message
					: 'Failed to update the image collection.',
			)
		}

		const collection = payload?.collection as
			| { id?: string; name?: string; imageCount?: number; viewUrl?: string }
			| undefined

		setCollectionSyncMessage(
			`Collection ${collection?.name ?? ''} now has ${collection?.imageCount ?? 0} images.`,
		)

		setCollectionSyncUrl(
			typeof collection?.viewUrl === 'string' ? collection.viewUrl : null,
		)

		if (typeof collection?.id === 'string') {
			setSelectedCollectionId(collection.id)
		}

		if (collectionMode === 'new') {
			setCollectionMode('existing')
			setNewCollectionName('')
		}

		await loadCollections()
		setIsSyncingCollection(false)
	}

	const handleUploadAll = async () => {
		if (!selectedFiles.length) {
			setUploadError('Select one or more images before uploading.')
			return
		}

		if (collectionMode === 'existing' && !selectedCollectionId) {
			setUploadError('Select an existing image collection.')
			return
		}

		if (collectionMode === 'new' && !newCollectionName.trim()) {
			setUploadError('Enter a name for the new image collection.')
			return
		}

		setUploadError(null)
		setCollectionSyncError(null)
		setCollectionSyncMessage(null)
		setCollectionSyncUrl(null)
		setIsUploading(true)

		let nextIndex = 0
		const workerCount = Math.min(concurrency, selectedFiles.length)
		const uploadedImages: Array<CollectionImage | undefined> = new Array(
			selectedFiles.length,
		)

		const worker = async () => {
			while (true) {
				const currentIndex = nextIndex
				nextIndex += 1

				if (currentIndex >= selectedFiles.length) {
					return
				}

				const currentFile = selectedFiles[currentIndex]
				try {
					uploadedImages[currentIndex] = await uploadSingle(
						currentFile,
						currentIndex,
					)
				} catch (error) {
					updateResult(currentIndex, {
						status: 'error',
						error:
							error instanceof Error ? error.message : 'Unknown upload error.',
					})
				}
			}
		}

		await Promise.all(Array.from({ length: workerCount }, () => worker()))

		const successfulImages = uploadedImages.filter(
			(image): image is CollectionImage => Boolean(image),
		)

		if (successfulImages.length && collectionMode !== 'none') {
			try {
				await syncCollection(successfulImages)
			} catch (error) {
				setCollectionSyncError(
					error instanceof Error
						? error.message
						: 'Failed to update image collection.',
				)
				setIsSyncingCollection(false)
			}
		}

		setIsUploading(false)
	}

	return (
		<Container maxWidth='lg'>
			<Stack spacing={3} marginTop={3} marginBottom={3}>
				<Typography variant='h3'>Image Collection Creator</Typography>
				<Typography variant='body1'>
					Upload large image batches to Builder using a secure server-side
					upload route. This flow is optimized for 100+ images.
				</Typography>

				<Paper sx={{ padding: 3 }}>
					<Stack spacing={2}>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
							<InputFileUpload
								onChange={handleFileUpload}
								accept='image/*'
								multiple
								label='Select images'
							/>
							<Button
								variant='outlined'
								disabled={isUploading}
								onClick={() => {
									setSelectedFiles([])
									setResults([])
									setUploadError(null)
								}}>
								Clear selection
							</Button>
						</Stack>

						<Typography variant='body2'>
							Selected files: {selectedFiles.length}
						</Typography>

						<TextField
							label='Builder folder ID (optional)'
							value={folderId}
							onChange={(event) => setFolderId(event.target.value)}
							placeholder='a0c7e097c0c34c16aadc5a204affe346'
							disabled={isUploading}
							fullWidth
						/>

						<TextField
							label='Name prefix (optional)'
							value={namePrefix}
							onChange={(event) => setNamePrefix(event.target.value)}
							placeholder='spring-campaign-'
							disabled={isUploading}
							fullWidth
						/>

						<TextField
							label='Alt text template (optional)'
							value={altTextTemplate}
							onChange={(event) => setAltTextTemplate(event.target.value)}
							placeholder='Product image for {name}'
							disabled={isUploading}
							fullWidth
						/>

						<TextField
							label='Title template (optional)'
							value={titleTemplate}
							onChange={(event) => setTitleTemplate(event.target.value)}
							placeholder='Image: {name}'
							disabled={isUploading}
							fullWidth
						/>

						<Paper variant='outlined' sx={{ padding: 2 }}>
							<Stack spacing={2}>
								<Typography variant='subtitle1'>
									Auto-add uploaded images to an image collection
								</Typography>

								<RadioGroup
									value={collectionMode}
									onChange={(event) =>
										setCollectionMode(event.target.value as CollectionMode)
									}
									row>
									<FormControlLabel
										value='none'
										control={<Radio />}
										label='Do not auto-add'
									/>
									<FormControlLabel
										value='existing'
										control={<Radio />}
										label='Add to existing collection'
									/>
									<FormControlLabel
										value='new'
										control={<Radio />}
										label='Create new collection'
									/>
								</RadioGroup>

								{collectionMode === 'existing' && (
									<Stack spacing={1}>
										<FormControl fullWidth disabled={isLoadingCollections}>
											<InputLabel id='collection-select-label'>
												Image collection
											</InputLabel>
											<Select
												labelId='collection-select-label'
												label='Image collection'
												value={selectedCollectionId}
												onChange={(event) =>
													setSelectedCollectionId(event.target.value)
												}>
												{collections.map((collection) => (
													<MenuItem key={collection.id} value={collection.id}>
														{collection.name}
														{collection.isUnpublished ? ' (Unpublished)' : ''} (
														{collection.imageCount})
													</MenuItem>
												))}
											</Select>
										</FormControl>
										<Button
											variant='outlined'
											onClick={() => {
												void loadCollections()
											}}
											disabled={isLoadingCollections}>
											Refresh collections
										</Button>
									</Stack>
								)}

								{collectionMode === 'new' && (
									<TextField
										label='New collection name'
										value={newCollectionName}
										onChange={(event) =>
											setNewCollectionName(event.target.value)
										}
										placeholder='Spring Product Photos'
										disabled={isUploading}
										fullWidth
									/>
								)}
							</Stack>
						</Paper>

						<Box>
							<Typography variant='body2' gutterBottom>
								Concurrent uploads: {concurrency}
							</Typography>
							<Slider
								value={concurrency}
								onChange={(_event, value) =>
									setConcurrency(Array.isArray(value) ? value[0] : value)
								}
								min={1}
								max={MAX_CONCURRENCY}
								step={1}
								disabled={isUploading}
								marks
							/>
						</Box>

						<Button
							variant='contained'
							onClick={handleUploadAll}
							disabled={isUploading || !selectedFiles.length}>
							{isUploading ? 'Uploading...' : 'Upload to Builder'}
						</Button>

						{uploadError && <Alert severity='error'>{uploadError}</Alert>}
						{collectionSyncError && (
							<Alert severity='error'>{collectionSyncError}</Alert>
						)}
						{collectionSyncMessage && (
							<Alert severity='success'>
								{collectionSyncMessage}
								{collectionSyncUrl && (
									<>
										{' '}
										<a
											href={collectionSyncUrl}
											target='_blank'
											rel='noreferrer'>
											View on Builder
										</a>
									</>
								)}
							</Alert>
						)}
						{isSyncingCollection && (
							<Alert severity='info'>
								Updating Builder image collection...
							</Alert>
						)}

						{selectedFiles.length > 0 && (
							<Stack spacing={1}>
								<Typography variant='body2'>
									Processed: {processedCount}/{selectedFiles.length} | Success:{' '}
									{successCount} | Failed: {errorCount}
								</Typography>
								<LinearProgress variant='determinate' value={progressValue} />
							</Stack>
						)}
					</Stack>
				</Paper>

				{results.length > 0 && (
					<Paper sx={{ padding: 2 }}>
						<Typography variant='h6' marginBottom={2}>
							Upload results
						</Typography>
						<Box sx={{ maxHeight: 420, overflow: 'auto' }}>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>File</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Orientation</TableCell>
										<TableCell>Alt text</TableCell>
										<TableCell>URL</TableCell>
										<TableCell>Error</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{results.map((item, index) => (
										<TableRow key={`${item.name}-${index}`}>
											<TableCell>{item.name}</TableCell>
											<TableCell>{item.status}</TableCell>
											<TableCell>{item.orientation ?? '-'}</TableCell>
											<TableCell>{item.altText ?? '-'}</TableCell>
											<TableCell>
												{item.url ? (
													<a href={item.url} target='_blank' rel='noreferrer'>
														Open
													</a>
												) : (
													'-'
												)}
											</TableCell>
											<TableCell>{item.error ?? '-'}</TableCell>
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
