import { CsvItem } from '@/app/brand-mapper/CsvContext'
import {
	TableContainer,
	Paper,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from '@mui/material'

const ItemRow = ({ item }: { item: CsvItem }) => {
	return (
		<TableRow>
			{Object.keys(item).map((key) => (
				<TableCell key={key} sx={{ fontSize: 'smaller' }}>
					{item[key]}
				</TableCell>
			))}
		</TableRow>
	)
}

const CsvItemTable = ({
	headers,
	items,
}: {
	headers: string[]
	items: CsvItem[]
}) => {
	return (
		<TableContainer component={Paper}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						{headers.map((header, index) => (
							<TableCell key={index}>{header}</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{items.map((item, index) => (
						<ItemRow item={item} key={index} />
					))}
					<TableRow>
						{headers.map((header, index) => (
							<TableCell key={index}>{header}</TableCell>
						))}
					</TableRow>
				</TableBody>
			</Table>
		</TableContainer>
	)
}

export default CsvItemTable
