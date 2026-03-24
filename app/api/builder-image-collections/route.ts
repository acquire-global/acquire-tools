import { NextResponse } from 'next/server'

type Orientation = 'landscape' | 'portrait'

type CollectionImage = {
	image: string
	description: string
	orientation: Orientation
}

type BuilderCollection = {
	id: string
	name: string
	published?: string | boolean
	data?: {
		description?: string
		images?: CollectionImage[]
		[key: string]: unknown
	}
}

type BuilderContentResponse = {
	results?: BuilderCollection[]
}

type CollectionActionRequest =
	| {
			action: 'create'
			collectionName: string
			images: CollectionImage[]
	  }
	| {
			action: 'append'
			collectionId: string
			images: CollectionImage[]
	  }

const MODEL_NAME = 'image-collection'
const PUBLIC_CONTENT_ENDPOINT = `https://cdn.builder.io/api/v3/content/${MODEL_NAME}`
const WRITE_ENDPOINT = `https://builder.io/api/v1/write/${MODEL_NAME}`
const PAGE_SIZE = 100

function getBuilderCollectionViewUrl(collectionId: string) {
	return `https://builder.io/content/${MODEL_NAME}/${collectionId}`
}

function isUnpublishedCollection(
	publishedValue: BuilderCollection['published'],
): boolean {
	if (typeof publishedValue === 'boolean') {
		return publishedValue === false
	}

	if (typeof publishedValue === 'string') {
		return publishedValue.toLowerCase() !== 'published'
	}

	return false
}

function parseJsonSafely(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

function normalizeImages(images: unknown): CollectionImage[] {
	if (!Array.isArray(images)) {
		return []
	}

	return images
		.filter(
			(item): item is Partial<CollectionImage> =>
				typeof item === 'object' && item !== null,
		)
		.map((item) => {
			const orientation: Orientation =
				item.orientation === 'portrait' ? 'portrait' : 'landscape'

			return {
				image: typeof item.image === 'string' ? item.image : '',
				description:
					typeof item.description === 'string' ? item.description : '',
				orientation,
			}
		})
		.filter((item) => item.image.length > 0)
}

async function fetchAllCollections(publicApiKey: string) {
	const allCollections: BuilderCollection[] = []
	let offset = 0

	while (true) {
		const url = new URL(PUBLIC_CONTENT_ENDPOINT)
		url.searchParams.set('apiKey', publicApiKey)
		url.searchParams.set('limit', String(PAGE_SIZE))
		url.searchParams.set('offset', String(offset))
		url.searchParams.set('noTargeting', 'true')
		url.searchParams.set('includeUnpublished', 'true')
		url.searchParams.set(
			'fields',
			'id,name,published,data.description,data.images',
		)

		const response = await fetch(url, { method: 'GET' })
		const rawText = await response.text()
		const payload = parseJsonSafely(rawText)

		if (!response.ok) {
			throw new Error(
				`Builder public API request failed (${response.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`,
			)
		}

		const parsed = payload as BuilderContentResponse
		const page = Array.isArray(parsed.results) ? parsed.results : []
		allCollections.push(...page)

		if (page.length < PAGE_SIZE) {
			break
		}

		offset += PAGE_SIZE
	}

	return allCollections
}

async function fetchCollectionById(publicApiKey: string, collectionId: string) {
	const url = new URL(PUBLIC_CONTENT_ENDPOINT)
	url.searchParams.set('apiKey', publicApiKey)
	url.searchParams.set('limit', '1')
	url.searchParams.set('noTargeting', 'true')
	url.searchParams.set('includeUnpublished', 'true')
	url.searchParams.set('fields', 'id,name,data')
	url.searchParams.set('query.id', collectionId)

	const response = await fetch(url, { method: 'GET' })
	const rawText = await response.text()
	const payload = parseJsonSafely(rawText)

	if (!response.ok) {
		throw new Error(
			`Builder public API request failed (${response.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`,
		)
	}

	const parsed = payload as BuilderContentResponse
	return Array.isArray(parsed.results) ? parsed.results[0] : undefined
}

export async function GET() {
	const publicApiKey = process.env.BUILDER_PUBLIC_API_KEY

	if (!publicApiKey) {
		return NextResponse.json(
			{
				message:
					'Missing BUILDER_PUBLIC_API_KEY environment variable on the server.',
			},
			{ status: 500 },
		)
	}

	try {
		const collections = await fetchAllCollections(publicApiKey)
		return NextResponse.json({
			collections: collections.map((collection) => ({
				id: collection.id,
				name: collection.name,
				isUnpublished: isUnpublishedCollection(collection.published),
				viewUrl: getBuilderCollectionViewUrl(collection.id),
				description: collection.data?.description ?? collection.name,
				imageCount: normalizeImages(collection.data?.images).length,
			})),
		})
	} catch (error) {
		return NextResponse.json(
			{
				message:
					error instanceof Error
						? error.message
						: 'Failed to fetch image collections from Builder.',
			},
			{ status: 500 },
		)
	}
}

export async function POST(request: Request) {
	const publicApiKey = process.env.BUILDER_PUBLIC_API_KEY
	const privateApiKey = process.env.BUILDER_PRIVATE_API_KEY

	if (!publicApiKey) {
		return NextResponse.json(
			{
				message:
					'Missing BUILDER_PUBLIC_API_KEY environment variable on the server.',
			},
			{ status: 500 },
		)
	}

	if (!privateApiKey) {
		return NextResponse.json(
			{
				message:
					'Missing BUILDER_PRIVATE_API_KEY environment variable on the server.',
			},
			{ status: 500 },
		)
	}

	let body: CollectionActionRequest
	try {
		body = (await request.json()) as CollectionActionRequest
	} catch {
		return NextResponse.json(
			{ message: 'Invalid JSON body for collection action.' },
			{ status: 400 },
		)
	}

	const images = normalizeImages(body.images)
	if (!images.length) {
		return NextResponse.json(
			{
				message:
					'At least one uploaded image is required to update collections.',
			},
			{ status: 400 },
		)
	}

	try {
		if (body.action === 'create') {
			const collectionName = body.collectionName.trim()
			if (!collectionName) {
				return NextResponse.json(
					{ message: 'A new collection name is required.' },
					{ status: 400 },
				)
			}

			const createResponse = await fetch(WRITE_ENDPOINT, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${privateApiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: collectionName,
					data: {
						description: collectionName,
						images,
					},
				}),
			})

			const createRawText = await createResponse.text()
			const createPayload = parseJsonSafely(createRawText)

			if (!createResponse.ok) {
				return NextResponse.json(
					{
						message: 'Failed to create image collection in Builder.',
						builderStatus: createResponse.status,
						builderResponse: createPayload,
					},
					{ status: createResponse.status },
				)
			}

			const created = createPayload as BuilderCollection
			return NextResponse.json({
				action: 'create',
				collection: {
					id: created.id,
					name: created.name,
					viewUrl: getBuilderCollectionViewUrl(created.id),
					description: collectionName,
					imageCount: images.length,
				},
			})
		}

		if (!body.collectionId.trim()) {
			return NextResponse.json(
				{ message: 'An existing collection ID is required.' },
				{ status: 400 },
			)
		}

		const existingCollection = await fetchCollectionById(
			publicApiKey,
			body.collectionId,
		)

		if (!existingCollection) {
			return NextResponse.json(
				{ message: 'Could not find the selected image collection.' },
				{ status: 404 },
			)
		}

		const existingData =
			typeof existingCollection.data === 'object' &&
			existingCollection.data !== null
				? existingCollection.data
				: {}

		const mergedImages = [...normalizeImages(existingData.images), ...images]

		const patchResponse = await fetch(
			`${WRITE_ENDPOINT}/${existingCollection.id}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${privateApiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					data: {
						...existingData,
						description:
							typeof existingData.description === 'string' &&
							existingData.description.trim()
								? existingData.description
								: existingCollection.name,
						images: mergedImages,
					},
				}),
			},
		)

		const patchRawText = await patchResponse.text()
		const patchPayload = parseJsonSafely(patchRawText)

		if (!patchResponse.ok) {
			return NextResponse.json(
				{
					message: 'Failed to append images to the selected image collection.',
					builderStatus: patchResponse.status,
					builderResponse: patchPayload,
				},
				{ status: patchResponse.status },
			)
		}

		return NextResponse.json({
			action: 'append',
			collection: {
				id: existingCollection.id,
				name: existingCollection.name,
				viewUrl: getBuilderCollectionViewUrl(existingCollection.id),
				description:
					typeof existingData.description === 'string' &&
					existingData.description.trim()
						? existingData.description
						: existingCollection.name,
				imageCount: mergedImages.length,
			},
		})
	} catch (error) {
		return NextResponse.json(
			{
				message:
					error instanceof Error
						? error.message
						: 'Failed to process collection action.',
			},
			{ status: 500 },
		)
	}
}
