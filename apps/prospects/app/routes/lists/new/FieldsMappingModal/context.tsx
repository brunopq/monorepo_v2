import { createContext, useContext, useState, useCallback } from "react"

import type { FieldMapping } from "../types"

type FieldsMappingModalContextType = {
  localMappings: FieldMapping[]
  fields: string[]
  getMappingByName: (name: string) => FieldMapping | undefined
  handleSetName: (mappingName: string, newName: string) => void
  handleSetField: (mappingName: string, field: string) => void
  handleToggleVisibility: (mappingName: string) => void
  handleUpdateMappings: () => void
}

const fieldsMappingModalContext = createContext<
  FieldsMappingModalContextType | undefined
>(undefined)

type FieldsMappingModalProviderProps = {
  children: React.ReactNode
  onUpdateMappings: (mappings: FieldMapping[]) => void
  initialMappings: FieldMapping[]
  fields: string[]
}

export function FieldsMappingModalProvider({
  children,
  onUpdateMappings,
  initialMappings,
  fields,
}: FieldsMappingModalProviderProps) {
  const [localMappings, setLocalMappings] =
    useState<FieldMapping[]>(initialMappings)

  const handleSetName = useCallback((mappingName: string, newName: string) => {
    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.name === mappingName ? { ...mapping, name: newName } : mapping,
      ),
    )
  }, [])

  const handleSetField = useCallback((mappingName: string, field: string) => {
    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.name === mappingName ? { ...mapping, field } : mapping,
      ),
    )
  }, [])

  const handleToggleVisibility = useCallback((mappingName: string) => {
    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.name === mappingName
          ? { ...mapping, visible: !mapping.visible }
          : mapping,
      ),
    )
  }, [])

  const getMappingByName = useCallback(
    (name: string) => localMappings.find((mapping) => mapping.name === name),
    [localMappings],
  )

  return (
    <fieldsMappingModalContext.Provider
      value={{
        localMappings,
        fields,
        getMappingByName,
        handleSetName,
        handleSetField,
        handleToggleVisibility,
        handleUpdateMappings: () => onUpdateMappings(localMappings),
      }}
    >
      {children}
    </fieldsMappingModalContext.Provider>
  )
}

export function useFieldsMappingModalContext() {
  const context = useContext(fieldsMappingModalContext)
  if (!context) {
    throw new Error(
      "`useFieldsMappingModalContext` must be used within a `FieldsMappingModalProvider`",
    )
  }
  return context
}
