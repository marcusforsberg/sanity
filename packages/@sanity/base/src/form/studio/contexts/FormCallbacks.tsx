/* eslint-disable react/no-unused-prop-types */
import {Path} from '@sanity/types'
import React, {memo, useContext} from 'react'
import {PatchEvent} from '../../patch'

interface FormCallbacksValue {
  onChange: (patchEvent: PatchEvent) => void
  onPathFocus: (path: Path) => void
  onPathBlur: (path: Path) => void
  onSetCollapsedPath: (path: Path, collapsed: boolean) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void
  onSelectFieldGroup: (path: Path, fieldGroupName: string) => void
}

const FormContext = React.createContext<FormCallbacksValue | null>(null)

export const FormCallbacksProvider = memo(function FormCallbacksProvider(
  props: FormCallbacksValue & {children: React.ReactNode}
) {
  return <FormContext.Provider value={props}>{props.children}</FormContext.Provider>
})

export function useFormCallbacks(): FormCallbacksValue {
  const ctx = useContext(FormContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}
