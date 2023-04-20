'use client'

import { Button } from '@mui/material'
import { Destination } from 'acquire-xml-generator'
import { useMappingsContext } from './MappingsContext'

const RequiredDestinationTag: React.FC<{ destination: Destination }> = ({
	destination,
}) => {
	const { mappings, createMapping } = useMappingsContext()
	const isUsed = mappings.some(
		(mapping) => mapping.destination === destination.name
	)

	const handleClick = () => {
		if (!isUsed) {
			createMapping({
				destination: destination.name,
				sourceIndex: mappings.length
					? mappings[mappings.length - 1].sourceIndex + 1
					: 0,
			})
		}
	}
	return (
		<Button
			variant={'contained'}
			disabled={isUsed}
			color={isUsed ? 'success' : 'error'}
			onClick={handleClick}>
			{destination.name}
		</Button>
	)
}

export default RequiredDestinationTag
