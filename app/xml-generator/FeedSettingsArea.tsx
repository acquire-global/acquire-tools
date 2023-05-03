import { useRef } from 'react'
import MappingLine from './MappingLine'
import { MappingConfig } from 'acquire-xml-generator'
import { useFeedSettingsContext } from './FeedSettingsContext'
import {
	Button,
	FormControlLabel,
	MenuItem,
	Paper,
	Stack,
	Switch,
	TextField,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { generateSupplierFeedSettings } from 'acquire-xml-generator'

const FeedSettingsArea: React.FC = () => {
	const {
		mappings,
		fileSettings,
		createMapping,
		updateMapping,
		changeFileSetting,
	} = useFeedSettingsContext()

	const generateMappingUpdater = (index: number) => {
		return (mapping: MappingConfig) => {
			updateMapping(index, mapping)
		}
	}

	const submitButtonRef = useRef<HTMLButtonElement>(null)
	const addLineButtonRef = useRef<HTMLButtonElement>(null)

	const addLine = () => {
		const nextIndex = mappings.length
			? mappings[mappings.length - 1].sourceIndex! + 1
			: 0
		createMapping({ sourceIndex: nextIndex })
		addLineButtonRef.current?.blur()
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		submitButtonRef.current?.blur()
		console.log(`mappings: `, mappings)
		try {
			const xml = generateSupplierFeedSettings({
				...fileSettings,
				mappings,
			})
			console.log('XML:\n', xml)
			const blob = new Blob([xml], { type: 'text/plain' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.download = 'feedsettings.xml'
			link.href = url
			link.click()
		} catch (error) {
			console.log('Error generating XML: ', error)
		}
	}

	return (
		<form autoComplete='off' onSubmit={handleSubmit}>
			<Stack gap={3}>
				<Paper elevation={3} sx={{ padding: 3 }}>
					<Grid container spacing={2} alignItems={'center'}>
						<Grid>
							<FormControlLabel
								control={
									<Switch
										name='hasHeader'
										checked={fileSettings.hasHeader}
										onChange={(e) =>
											changeFileSetting('hasHeader', e.target.checked)
										}
										inputProps={{ 'aria-label': 'Has Header Row?' }}
									/>
								}
								label='Has Header Row?'
							/>
						</Grid>
						<Grid>
							<FormControlLabel
								control={
									<Switch
										name='appendMissingColumns'
										checked={fileSettings.appendMissingColumns}
										onChange={(e) =>
											changeFileSetting(
												'appendMissingColumns',
												e.target.checked
											)
										}
										inputProps={{ 'aria-label': 'Append Missing Columns?' }}
									/>
								}
								label='Append Missing Columns?'
							/>
						</Grid>
						<Grid xs={2}>
							<TextField
								label='Skip Rows'
								type={'number'}
								name='skipRows'
								onChange={(e) => changeFileSetting('skipRows', e.target.value)}
								value={fileSettings.skipRows}
							/>
						</Grid>
						<Grid xs={2}>
							<TextField
								label='Column Delimiter'
								name='columnDelimiter'
								onChange={(e) =>
									changeFileSetting('columnDelimiter', e.target.value)
								}
								value={fileSettings.columnDelimiter}
							/>
						</Grid>
						<Grid xs={2}>
							<TextField
								label='Row Delimiter'
								name='rowDelimiter'
								onChange={(e) =>
									changeFileSetting('rowDelimiter', e.target.value)
								}
								value={fileSettings.rowDelimiter}
							/>
						</Grid>
						<Grid xs={2}>
							<TextField
								label='Text Delimiter'
								name='textDelimiter'
								onChange={(e) =>
									changeFileSetting('textDelimiter', e.target.value)
								}
								value={fileSettings.textDelimiter}
							/>
						</Grid>
						<Grid xs={2}>
							<TextField
								label='Encoding'
								name='encoding'
								select
								onChange={(e) => changeFileSetting('encoding', e.target.value)}
								value={fileSettings.encoding}>
								<MenuItem value='UTF-8'>UTF-8</MenuItem>
								<MenuItem value='ASCII'>ASCII</MenuItem>
							</TextField>
						</Grid>
					</Grid>
				</Paper>
				{mappings.map((mapping, index) => (
					<MappingLine
						mapping={mapping}
						mappingUpdater={generateMappingUpdater(index)}
						key={index}
						isLast={index === mappings.length - 1}
					/>
				))}
				<Button
					variant={'contained'}
					onClick={addLine}
					color={'secondary'}
					ref={addLineButtonRef}>
					Add Line
				</Button>
				<Button variant={'contained'} type={'submit'} ref={submitButtonRef}>
					Download XML
				</Button>
			</Stack>
		</form>
	)
}

export default FeedSettingsArea
