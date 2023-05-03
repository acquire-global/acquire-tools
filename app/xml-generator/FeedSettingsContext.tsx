'use client'

import { MappingConfig } from 'acquire-xml-generator'
import { createContext, useContext, useState } from 'react'

type FileSettings = {
	hasHeader: boolean
	appendMissingColumns: boolean
	skipRows: number
	columnDelimiter: string
	rowDelimiter: string
	textDelimiter: string
	encoding: 'UTF-8' | 'ASCII'
}

type FeedSettings = {
	mappings: MappingConfig[]
	fileSettings: FileSettings
	createMapping: (mapping: MappingConfig) => void
	removeMapping: (mapping: MappingConfig) => void
	updateMapping: (index: number, mapping: MappingConfig) => void
	changeFileSetting: (
		setting: keyof FileSettings,
		value: FileSettings[keyof FileSettings]
	) => void
}

const defaultState: FeedSettings = {
	mappings: [],
	fileSettings: {
		hasHeader: true,
		appendMissingColumns: false,
		skipRows: 0,
		columnDelimiter: ',',
		rowDelimiter: '\\n',
		textDelimiter: '"',
		encoding: 'UTF-8',
	},
	createMapping: () => {},
	removeMapping: () => {},
	updateMapping: () => {},
	changeFileSetting: () => {},
}

export const FeedSettingsContext = createContext<FeedSettings>(defaultState)

export const FeedSettingsProvider: React.FC<{
	children: React.ReactElement
}> = ({ children }) => {
	const [feedSettings, setFeedSettings] = useState<FeedSettings>(defaultState)

	const createMapping = (mapping: MappingConfig) => {
		setFeedSettings((currentFeedSettings) => {
			const newMappings = [...currentFeedSettings.mappings, mapping]
			return { ...currentFeedSettings, mappings: newMappings }
		})
	}

	const removeMapping = (mapping: MappingConfig) => {
		setFeedSettings((currentFeedSettings) => {
			const newMappings = currentFeedSettings.mappings.filter(
				(m) => m !== mapping
			)
			return { ...currentFeedSettings, mappings: newMappings }
		})
	}

	const updateMapping = (index: number, mapping: MappingConfig) => {
		setFeedSettings((currentFeedSettings) => {
			const newMappings = [...currentFeedSettings.mappings]
			newMappings[index] = mapping
			return { ...currentFeedSettings, mappings: newMappings }
		})
	}

	const changeFileSetting = (
		setting: keyof FileSettings,
		value: FileSettings[keyof FileSettings]
	) => {
		setFeedSettings((currentFeedSettings) => {
			const newFileSettings = {
				...currentFeedSettings.fileSettings,
				[setting]: value,
			}
			return { ...currentFeedSettings, fileSettings: newFileSettings }
		})
	}

	return (
		<FeedSettingsContext.Provider
			value={{
				mappings: feedSettings.mappings,
				fileSettings: feedSettings.fileSettings,
				createMapping,
				removeMapping,
				updateMapping,
				changeFileSetting,
			}}>
			{children}
		</FeedSettingsContext.Provider>
	)
}

export const useFeedSettingsContext = () => useContext(FeedSettingsContext)
