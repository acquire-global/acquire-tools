'use client'

import {
	Autocomplete,
	FormControlLabel,
	IconButton,
	Paper,
	Switch,
	TextField,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { useFeedSettingsContext } from './FeedSettingsContext'
import { MappingConfig, destinations } from 'acquire-xml-generator'
import { useState } from 'react'
import Delete from '@mui/icons-material/Delete'

const destinationsOptions = Object.keys(destinations).sort()

type MappingLineProps = {
	mapping: MappingConfig
	mappingUpdater: (mapping: MappingConfig) => void
	isLast: boolean
}

const MappingLine: React.FC<MappingLineProps> = ({
	mapping,
	mappingUpdater,
	isLast,
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const target = event.target
		let value: string | boolean | number =
			target.type === 'checkbox' ? target.checked : target.value
		target.type === 'number' && (value = parseInt(value as string))
		const name = target.name

		if (typeof value === 'number' && value < 0) value = 0

		mappingUpdater({
			...mapping,
			destination: name === 'skip' ? undefined : mapping.destination,
			[name]: value,
		})
	}

	const handleDestinationChange = (event: any, value: string | null) => {
		mappingUpdater({
			...mapping,
			destination: value as MappingConfig['destination'],
		})
	}

	const { mappings, removeMapping } = useFeedSettingsContext()

	const [destinationText, setDestinationText] = useState(
		mapping.destination ?? ''
	)

	return (
		<Paper elevation={3} sx={{ p: 2, mb: 2 }}>
			<Grid container spacing={2} alignItems={'center'}>
				<Grid xs={2}>
					<TextField
						label='Source Index'
						type={'number'}
						name='sourceIndex'
						onChange={handleChange}
						value={mapping.sourceIndex}
						autoFocus={isLast}
						required
					/>
				</Grid>
				<Grid xs={'auto'}>
					<TextField
						label='Source Name (Optional)'
						type={'text'}
						name='sourceName'
						onChange={handleChange}
						value={mapping.sourceName ?? ''}
					/>
				</Grid>
				<Grid xs={2}>
					<FormControlLabel
						control={
							<Switch
								name='skip'
								checked={mapping.skip ?? false}
								onChange={handleChange}
								inputProps={{ 'aria-label': 'Skip?' }}
							/>
						}
						label='Skip?'
					/>
				</Grid>
				<Grid xs={3}>
					<Autocomplete
						options={destinationsOptions}
						getOptionDisabled={(option) => {
							return mappings.some(
								(m) => m.destination === option && m !== mapping
							)
						}}
						disabled={mapping.skip}
						value={mapping.destination ?? null}
						onChange={handleDestinationChange}
						inputValue={destinationText ?? ''}
						onInputChange={(event, newInputValue) => {
							setDestinationText(newInputValue)
						}}
						autoComplete={true}
						autoHighlight={true}
						autoSelect={true}
						renderInput={(params) => (
							<TextField
								{...params}
								label={mapping.skip ? '' : 'Destination column'}
								name='destination'
								required={!mapping.skip}
								error={mapping.skip ? false : !mapping.destination}
							/>
						)}
					/>
				</Grid>
				<Grid xs={1}>
					<IconButton onClick={() => removeMapping(mapping)}>
						<Delete />
					</IconButton>
				</Grid>
			</Grid>
		</Paper>
	)
}

export default MappingLine
