'use client'

import { destinations } from 'acquire-xml-generator'
import RequiredDestinationTag from './RequiredDestinationTag'
import MappingsArea from './MappingsArea'
import { Container, Paper, Stack } from '@mui/material'
import { MappingsProvider } from './MappingsContext'

export default function Page() {
	const destinationsArray = Object.values(destinations)

	return (
		<MappingsProvider>
			<Container>
				<Paper elevation={0}>
					<Stack gap={3}>
						<h1>XML Generator</h1>
						<Paper elevation={1} sx={{ padding: 3 }}>
							<h2>Required Fields</h2>
							<Stack direction={'row'} gap={3}>
								{destinationsArray.map((destination) =>
									destination.isRequired ? (
										<RequiredDestinationTag
											key={destination.index}
											destination={destination}
										/>
									) : null
								)}
							</Stack>
						</Paper>
						<Paper elevation={1} sx={{ padding: 3 }}>
							<h2>Create Mappings</h2>
							<MappingsArea />
						</Paper>
					</Stack>
				</Paper>
			</Container>
		</MappingsProvider>
	)
}
