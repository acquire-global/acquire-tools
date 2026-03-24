'use client'

import {
	Collapse,
	Button,
	Stack,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
} from '@mui/material'
import { useCsv } from './CsvContext'
import { useState, useMemo } from 'react'
import CsvItemTable from '@/components/CsvItemTable'

function selectUniqueByProperty<T, K extends keyof T>(items: T[], key: K): T[] {
	const uniqueItems = items.reduce((acc: T[], item) => {
		if (!acc.some((accItem) => accItem[key] === item[key])) {
			acc.push(item)
		}
		return acc
	}, [])

	return uniqueItems
}

const ColumnsPreview = () => {
	const { items, headers, brandColumn, setBrandColumn } = useCsv()
	const sampledItems = useMemo(() => {
		if (!brandColumn) return items.sort(() => Math.random() - 0.5).slice(0, 10)
		const uniqueItems = selectUniqueByProperty(items, brandColumn)
		return uniqueItems.slice(0, 10)
	}, [items, brandColumn])
	const [open, setOpen] = useState(false)

	return (
		<>
			<FormControl>
				<InputLabel id='brand-column-label'>Brand Column</InputLabel>
				<Select
					labelId='brand-column-label'
					label='Brand Column'
					id='column-name-select'
					name='brandColumn'
					value={brandColumn}
					onChange={(e) => setBrandColumn(e.target.value)}>
					{headers.map((header, index) => (
						<MenuItem value={header} key={index}>
							{header}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<Button
				variant='outlined'
				color='secondary'
				aria-label='toggle item preview'
				onClick={() => setOpen(!open)}
				fullWidth>
				{open ? 'Close Preview' : 'Preview Items'}
			</Button>
			<Collapse in={open} timeout='auto' unmountOnExit>
				<Stack spacing={2} marginBottom={2}>
					<CsvItemTable headers={headers} items={sampledItems} />
					<Button
						variant='outlined'
						color='secondary'
						aria-label='toggle item preview'
						onClick={() => setOpen(!open)}
						fullWidth>
						{open ? 'Close Preview' : 'Preview Items'}
					</Button>
				</Stack>
			</Collapse>
		</>
	)
}

export default ColumnsPreview
