'use client'
import React, { useState } from 'react'
import Papa from 'papaparse'

import { CsvItem, CsvProvider } from './CsvContext'
import { Container, Stack, Typography } from '@mui/material'
import InputFileUpload from '@/components/InputFileUpload'
import ColumnsPreview from './ColumnsPreview'
import MappingsSection from '@/components/MappingsSection/MappingsSection'

const BrandMapperPage = () => {
	const [fileName, setFileName] = useState<string>('')
	const [items, setItems] = useState<Record<string, string>[]>([])

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const csvFile = event.target.files?.[0]
		if (csvFile) {
			Papa.parse<CsvItem>(csvFile, {
				complete: (results) => {
					setFileName(csvFile.name)
					setItems(results.data)
				},
				header: true,
				skipEmptyLines: 'greedy',
			})
		}
	}

	return (
		<Container>
			<Stack justifyContent={'center'} gap={2} marginTop={2}>
				<Typography variant={'h1'}>Brand Mapper</Typography>
				{!fileName && (
					<Typography variant={'subtitle1'}>
						Upload a CSV file to get started
					</Typography>
				)}
				<InputFileUpload accept='.csv' onChange={handleFileUpload} />
				{fileName && <Typography>Loaded file {fileName}</Typography>}
				{items.length > 0 && (
					<CsvProvider items={items}>
						<ColumnsPreview />
						<MappingsSection />
					</CsvProvider>
				)}
			</Stack>
		</Container>
	)
}

export default BrandMapperPage
