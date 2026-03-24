'use client'

import { createContext, useContext, useState } from 'react'
import { Rule, conditionTypes } from './types'

const createEmptyRule = (): Rule =>
	new Rule({
		id: Math.random().toString(36).substring(7),
		inputColumn: '',
		condition: {
			type: conditionTypes.EXACT,
			value: '',
		},
		outputValue: '',
	})

export interface RulesContext {
	rules: Rule[]
	createRule: () => void
	updateRule: (updatedRule: Rule) => void
	deleteRule: (rule: Rule) => void
}

const RulesContext = createContext<RulesContext>({
	rules: [] as Rule[],
	createRule: () => {},
	updateRule: (updatedRule: Rule) => {},
	deleteRule: (rule: Rule) => {},
})

export const useRules = () => useContext(RulesContext)

export const RulesProvider = ({
	children,
	initialRules,
}: {
	children: React.ReactNode
	initialRules?: Rule[]
}) => {
	if (!initialRules || initialRules.length === 0) {
		initialRules = [createEmptyRule()]
	}
	const [rules, setRules] = useState<Rule[]>(initialRules)

	const createRule = () => {
		setRules([...rules, createEmptyRule()])
	}

	const updateRule = (updatedRule: Rule) => {
		setRules(
			rules.map((oldRule) =>
				oldRule.id === updatedRule.id
					? new Rule({ ...oldRule, ...updatedRule })
					: oldRule
			)
		)
	}

	const deleteRule = (rule: Rule) => {
		setRules(rules.filter((r) => r.id !== rule.id))
	}

	return (
		<RulesContext.Provider
			value={{
				rules,
				createRule,
				updateRule,
				deleteRule,
			}}>
			{children}
		</RulesContext.Provider>
	)
}
