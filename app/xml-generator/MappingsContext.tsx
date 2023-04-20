'use client'

import { MappingConfig } from 'acquire-xml-generator'
import { createContext, useContext, useState } from 'react'

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type OptionalDestinationMapping = Optional<MappingConfig, 'destination'>

type MappingsContextType = {
	mappings: OptionalDestinationMapping[]
	createMapping: (mapping: OptionalDestinationMapping) => void
	removeMapping: (mapping: OptionalDestinationMapping) => void
	updateMapping: (index: number, mapping: OptionalDestinationMapping) => void
}

const defaultState: MappingsContextType = {
	mappings: [],
	createMapping: () => {},
	removeMapping: () => {},
	updateMapping: () => {},
}

export const MappingsContext = createContext<MappingsContextType>(defaultState)

export const MappingsProvider: React.FC<{ children: React.ReactElement }> = ({
	children,
}) => {
	const [mappings, setMappings] = useState<OptionalDestinationMapping[]>([
		{ sourceIndex: 0 },
	])

	const createMapping = (mapping: OptionalDestinationMapping) => {
		setMappings((currentMappings) => [...currentMappings, mapping])
	}

	const removeMapping = (mapping: OptionalDestinationMapping) => {
		setMappings((currentMappings) =>
			currentMappings.filter((m) => m !== mapping)
		)
	}

	const updateMapping = (
		index: number,
		mapping: OptionalDestinationMapping
	) => {
		setMappings((currentMappings) => {
			const newMappings = [...currentMappings]
			newMappings[index] = mapping
			return newMappings
		})
	}

	return (
		<MappingsContext.Provider
			value={{ mappings, createMapping, removeMapping, updateMapping }}>
			{children}
		</MappingsContext.Provider>
	)
}

export const useMappingsContext = () => useContext(MappingsContext)
