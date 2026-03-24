import { Button, Stack } from '@mui/material'
import { Rule, conditionTypes } from './types'
import { RuleEditor } from './RuleEditor'
import { useState } from 'react'
import { useCsv } from '@/app/brand-mapper/CsvContext'

const RuleCreator = () => {
	const { brandColumn } = useCsv()

	return (
		<Stack spacing={2} marginBottom={2}>
			<Button variant={'contained'} fullWidth onClick={createRule}>
				Add Rule
			</Button>
			{rules.map((rule) => (
				<RuleEditor
					key={rule.id}
					rule={rule}
					updateRule={updateRule}
					deleteRule={deleteRule}
				/>
			))}
			{rules.length > 0 && (
				<Button variant={'contained'} fullWidth onClick={createRule}>
					Add Rule
				</Button>
			)}
		</Stack>
	)
}

export default RuleCreator
