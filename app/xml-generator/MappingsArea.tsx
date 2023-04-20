import { useRef, useState } from 'react'
import MappingLine from './MappingLine'
import { MappingConfig } from 'acquire-xml-generator'
import {
	OptionalDestinationMapping,
	useMappingsContext,
} from './MappingsContext'
import { Button, FormControlLabel, Paper, Stack, Switch } from '@mui/material'
import { generateSupplierFeedSettings } from 'acquire-xml-generator'

const MappingsArea: React.FC = () => {
	const { mappings, createMapping, updateMapping } = useMappingsContext()
	const [hasHeader, sethasHeader] = useState(true)

	const generateMappingUpdater = (index: number) => {
		return (mapping: OptionalDestinationMapping) => {
			updateMapping(index, mapping)
		}
	}

	const submitButtonRef = useRef<HTMLButtonElement>(null)
	const addLineButtonRef = useRef<HTMLButtonElement>(null)

	const addLine = () => {
		const nextIndex = mappings.length
			? mappings[mappings.length - 1].sourceIndex + 1
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
				hasHeader,
				mappings: mappings as MappingConfig[],
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
					<FormControlLabel
						control={
							<Switch
								name='hasHeader'
								checked={hasHeader}
								onChange={(e) => sethasHeader(e.target.checked)}
								inputProps={{ 'aria-label': 'Has Header Row?' }}
							/>
						}
						label='Has Header Row?'
					/>
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

export default MappingsArea
