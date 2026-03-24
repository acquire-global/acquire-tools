import {
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	Button,
	SelectChangeEvent,
} from '@mui/material'
import { Rule, conditionTypes } from './types'
import { ConditionType } from './types'
import { useCsv } from '../../app/brand-mapper/CsvContext'

export const RuleEditor = ({
	rule,
	updateRule,
	deleteRule,
}: {
	rule: Rule
	updateRule: (rule: Rule) => void
	deleteRule: (rule: Rule) => void
}) => {
	const { headers } = useCsv()

	const handleSelectChange = (e: SelectChangeEvent) => {
		const updatedRule = { ...rule }

		switch (e.target.name) {
			case 'inputColumn':
				updatedRule.inputColumn = e.target.value
				break
			case 'conditionType':
				updatedRule.condition.type = e.target.value as ConditionType
				break
		}

		updateRule(updatedRule)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const updatedRule = { ...rule }

		switch (e.target.name) {
			case 'outputValue':
				updatedRule.outputValue = e.target.value
				break
			case 'conditionValue':
				updatedRule.condition.value = e.target.value
				break
		}

		updateRule(updatedRule)
	}

	return (
		<Grid container spacing={2} alignItems={'center'}>
			<Grid item xs={12} sm={6} lg={3}>
				<FormControl fullWidth>
					<InputLabel id='column-name-label'>Column Name</InputLabel>
					<Select
						labelId='column-name-label'
						label='Column Name'
						id='column-name-select'
						name='inputColumn'
						value={rule.inputColumn}
						onChange={handleSelectChange}>
						{headers.map((header, index) => (
							<MenuItem value={header} key={index}>
								{header}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Grid>
			<Grid item xs={12} sm={6} lg={3}>
				<FormControl fullWidth>
					<InputLabel id='match-type-label'>Match Type</InputLabel>
					<Select
						labelId='match-type-label'
						label='Match Type'
						id='match-type-select'
						name='conditionType'
						value={rule.condition.type}
						onChange={handleSelectChange}>
						{Object.values(conditionTypes).map((type) => (
							<MenuItem value={type} key={type}>
								{type}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Grid>
			<Grid item xs={12} sm={5} lg={2}>
				<TextField
					fullWidth
					label='Pattern'
					name='conditionValue'
					value={rule.condition.value}
					onChange={handleInputChange}
				/>
			</Grid>
			<Grid item xs={12} sm={6} lg={3}>
				<TextField
					fullWidth
					label='Output (Acquire Brand)'
					name='outputValue'
					value={rule.outputValue}
					onChange={handleInputChange}
				/>
			</Grid>
			<Grid item xs={12} sm={1}>
				<Button
					variant='contained'
					color='error'
					onClick={() => deleteRule(rule)}>
					X
				</Button>
			</Grid>
			{rule.inputColumn && rule.condition.type && rule.condition.value && (
				<Grid item xs={12}>
					{/* <RulePreview rule={rule}> */}
				</Grid>
			)}
		</Grid>
	)
}
