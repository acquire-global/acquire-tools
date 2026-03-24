import { NextResponse } from 'next/server'

type UploadSuccess = {
	status?: number
	message?: string
	url?: string
	[key: string]: unknown
}

export async function POST(request: Request) {
	const privateApiKey = process.env.BUILDER_PRIVATE_API_KEY

	if (!privateApiKey) {
		return NextResponse.json(
			{
				message:
					'Missing BUILDER_PRIVATE_API_KEY environment variable on the server.',
			},
			{ status: 500 },
		)
	}

	const formData = await request.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return NextResponse.json(
			{ message: 'No file was provided in the upload request.' },
			{ status: 400 },
		)
	}

	const name = String(formData.get('name') ?? file.name)
	const altTextValue = formData.get('altText')
	const titleValue = formData.get('title')
	const folderValue = formData.get('folder')

	const uploadUrl = new URL('https://builder.io/api/v1/upload')
	uploadUrl.searchParams.set('name', name)

	if (typeof altTextValue === 'string' && altTextValue.trim()) {
		uploadUrl.searchParams.set('altText', altTextValue.trim())
	}

	if (typeof titleValue === 'string' && titleValue.trim()) {
		uploadUrl.searchParams.set('title', titleValue.trim())
	}

	if (typeof folderValue === 'string' && folderValue.trim()) {
		uploadUrl.searchParams.set('folder', folderValue.trim())
	}

	try {
		const fileBuffer = Buffer.from(await file.arrayBuffer())
		const builderResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${privateApiKey}`,
				'Content-Type': file.type || 'application/octet-stream',
			},
			body: fileBuffer,
		})

		const responseText = await builderResponse.text()
		let responseData: UploadSuccess | string = responseText

		try {
			responseData = JSON.parse(responseText) as UploadSuccess
		} catch {
			responseData = responseText
		}

		if (!builderResponse.ok) {
			return NextResponse.json(
				{
					message: 'Builder upload request failed.',
					builderStatus: builderResponse.status,
					builderResponse: responseData,
				},
				{ status: builderResponse.status },
			)
		}

		return NextResponse.json({
			fileName: file.name,
			builderResponse: responseData,
		})
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: 'Unknown server-side upload error.'

		return NextResponse.json(
			{
				message: 'Server error while uploading file to Builder.',
				error: message,
			},
			{ status: 500 },
		)
	}
}
