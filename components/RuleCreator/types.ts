import { CsvItem } from '@/app/brand-mapper/CsvContext'

export const conditionTypes = {
	EXACT: 'Exact Match',
	CONTAINS: 'Contains',
	STARTS_WITH: 'Starts With',
	ENDS_WITH: 'Ends With',
	REGEX: 'Regular Expression',
} as const

export type ConditionType = (typeof conditionTypes)[keyof typeof conditionTypes]

type RuleCondition = {
	type: ConditionType
	value: string
}

// Define the Rule interface
// export interface Rule {
// 	id: string // The unique id of the rule
// 	inputColumn: string // The name of the input column
// 	outputValue: string // The output value that the input column maps to
// 	condition: RuleCondition // The condition for the mapping
// 	match<T>(value: T): boolean // A function that returns true if the rule matches the value
// }

export class Rule {
	id: string
	inputColumn: string
	outputValue: string
	condition: RuleCondition

	constructor(rule: {
		id: string
		inputColumn: string
		outputValue: string
		condition: RuleCondition
	}) {
		this.id = rule.id
		this.inputColumn = rule.inputColumn
		this.outputValue = rule.outputValue
		this.condition = rule.condition
	}

	matches: (value: string) => boolean = (value) => {
		switch (this.condition.type) {
			case conditionTypes.EXACT:
				return value === this.condition.value
			case conditionTypes.CONTAINS:
				return value.includes(this.condition.value)
			case conditionTypes.STARTS_WITH:
				return value.startsWith(this.condition.value)
			case conditionTypes.ENDS_WITH:
				return value.endsWith(this.condition.value)
			case conditionTypes.REGEX:
				return new RegExp(this.condition.value).test(value)
			default:
				return false
		}
	}

	matchItems(items: CsvItem[]): { matched: CsvItem[]; remaining: CsvItem[] } {
		const matched: CsvItem[] = []
		const remaining: CsvItem[] = []

		items.forEach((item) => {
			if (this.matches(item[this.inputColumn])) {
				matched.push(item)
			} else {
				remaining.push(item)
			}
		})

		return { matched, remaining }
	}
}

export type SupplierBrandMapping = {
	supplierBrand: string
	acquireBrand: string
}
