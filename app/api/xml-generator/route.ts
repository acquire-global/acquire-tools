import { NextResponse } from 'next/server'
import { generateSupplierFeedSettings } from 'acquire-xml-generator'

export async function POST(request: Request) {
	try {
		const { feedConfig } = await request.json()

		const xml = generateSupplierFeedSettings(feedConfig)

		return NextResponse.json({ xml })
	} catch (error) {
		return NextResponse.error()
	}
}
