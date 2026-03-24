'use client'
import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	Stack,
} from '@mui/material'

import { useCsv } from './CsvContext'

const ColumnSelectorInterface = () => {
	const {
		brandHeader,
		nameHeader,
		toggleBrandHeader,
		toggleNameHeader,
		headers,
	} = useCsv()

	const handleChange = (event: SelectChangeEvent) => {
		const { name, value } = event.target
		if (name === 'brand') {
			toggleBrandHeader(headers[parseInt(value)])
		} else if (name === 'name') {
			toggleNameHeader(headers[parseInt(value)])
		}
	}
	return (
		<Stack direction={'row'} spacing={1}>
			<FormControl fullWidth>
				<InputLabel id='brand-column-select-label'>Brand Column</InputLabel>
				<Select
					labelId='brand-column-select-label'
					id='brand-column-select'
					name='brand'
					value={brandHeader?.index.toString() ?? ''}
					label='Brand Column'
					onChange={handleChange}>
					{headers.map((header) => (
						<MenuItem key={header.index} value={header.index}>
							{header.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<FormControl fullWidth>
				<InputLabel id='name-column-select-label'>Name Column</InputLabel>
				<Select
					labelId='name-column-select-label'
					id='name-column-select'
					name='name'
					value={nameHeader?.index.toString() ?? ''}
					label='Name Column'
					onChange={handleChange}>
					{headers.map((header) => (
						<MenuItem key={header.index} value={header.index}>
							{header.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</Stack>
	)
}

export default ColumnSelectorInterface
