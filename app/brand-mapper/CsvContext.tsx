'use client'
import { Rule, conditionTypes } from '@/components/RuleCreator/types'
import { createContext, useContext, useState } from 'react'

export type CsvItem = Record<string, string>

type ColumnHeader = keyof CsvItem

export interface CsvContext {
	items: CsvItem[]
	headers: string[]
	brandColumn: ColumnHeader | ''
	getSampleItems: (quantity?: number) => CsvItem[]
	getMatchingItems: (rule: Rule, quantity?: number) => CsvItem[]
	setBrandColumn: (column: ColumnHeader | '') => void
}

const CsvContext = createContext<CsvContext>({
	items: [],
	headers: [],
	brandColumn: '',
	getSampleItems: () => [],
	getMatchingItems: () => [],
	setBrandColumn: () => {},
})

export const useCsv = () => useContext(CsvContext)

export const CsvProvider = ({
	children,
	items,
}: {
	children: React.ReactNode
	items: CsvItem[]
}) => {
	const headers = Object.keys(items[0])

	const [brandColumn, setBrandColumn] = useState<ColumnHeader | ''>('')

	const getSampleItems = (quantity = 10) => {
		return items.sort(() => Math.random() - 0.5).slice(0, quantity)
	}

	const getMatchingItems = (rule: Rule, quantity = 5) => {
		return items
			.filter((item) => {
				const columnValue = item[rule.inputColumn]
				switch (rule.condition.type) {
					case conditionTypes.EXACT:
						return columnValue === rule.condition.value
					case conditionTypes.CONTAINS:
						return columnValue.includes(rule.condition.value)
					case conditionTypes.STARTS_WITH:
						return columnValue.startsWith(rule.condition.value)
					case conditionTypes.ENDS_WITH:
						return columnValue.endsWith(rule.condition.value)
					case conditionTypes.REGEX:
						return new RegExp(rule.condition.value).test(columnValue)
				}
			})
			.sort(() => Math.random() - 0.5)
			.slice(0, quantity)
	}

	return (
		<CsvContext.Provider
			value={{
				items,
				headers,
				brandColumn,
				getSampleItems,
				getMatchingItems,
				setBrandColumn,
			}}>
			{children}
		</CsvContext.Provider>
	)
}
