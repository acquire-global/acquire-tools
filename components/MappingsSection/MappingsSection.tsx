import { useCsv } from '@/app/brand-mapper/CsvContext'
import { RulesProvider } from '../RuleCreator/RulesContext'
import { Rule, SupplierBrandMapping } from '../RuleCreator/types'
import { useState } from 'react'

const MappingsSection = () => {
	const { items, brandColumn } = useCsv()
	const [mappings, setMappings] = useState<Set<SupplierBrandMapping>>([])

	const addMappingsFromRule = (rule: Rule) => {
		const { matched } = rule.matchItems(items)
		const newMappings: SupplierBrandMapping[] = matched.map((item) => ({
			supplierBrand: item[rule.inputColumn],
			acquireBrand: rule.outputValue,
		}))
		setMappings((oldMappings) =>
			newMappings.reduce((acc, mapping) => acc.add(mapping), oldMappings)
		)
	}

	return <RulesProvider>{/*<MappingsTable />*/}</RulesProvider>
}

export default MappingsSection
