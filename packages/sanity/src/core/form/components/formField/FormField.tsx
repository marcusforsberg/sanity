import {DeprecatedProperty, FormNodeValidation} from '@sanity/types'
import {Stack} from '@sanity/ui'
import React, {memo} from 'react'
import {FormNodePresence} from '../../../presence'
import {DocumentFieldActionNode} from '../../../config'
import {useFieldActions} from '../../field'
import {FieldCommentsProps} from '../../types'
import {FormFieldBaseHeader} from './FormFieldBaseHeader'
import {FormFieldHeaderText} from './FormFieldHeaderText'

const EMPTY_ARRAY: never[] = []

/** @internal */
export interface FormFieldProps {
  /**
   * @hidden
   * @beta
   */
  __unstable_headerActions?: DocumentFieldActionNode[]
  /**
   * @hidden
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: React.ReactNode
  children: React.ReactNode
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  /**
   * The nesting level of the form field
   */
  level?: number
  title?: React.ReactNode
  /**
   * @beta
   */
  validation?: FormNodeValidation[]
  deprecated?: DeprecatedProperty
}

/** @internal */
export const FormField = memo(function FormField(
  props: FormFieldProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
) {
  const {
    __unstable_headerActions: actions = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    __internal_slot: slot = null,
    __internal_comments: comments,
    children,
    description,
    inputId,
    level,
    title,
    validation,
    deprecated,
    ...restProps
  } = props
  const {focused, hovered, onMouseEnter, onMouseLeave} = useFieldActions()

  const isDeprecated = Boolean(deprecated?.reason)

  return (
    <Stack
      {...restProps}
      data-level={level}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      space={2}
      style={{
        opacity: isDeprecated ? 0.5 : undefined,
      }}
    >
      {isDeprecated && <p style={{margin: 0, color: 'red'}}>{deprecated?.reason.default}</p>}
      {/*
        NOTE: It’s not ideal to hide validation, presence and description when there's no `title`.
        So we might want to separate the concerns of input vs formfield components later on.
      */}
      {title && (
        <FormFieldBaseHeader
          __internal_comments={comments}
          __internal_slot={slot}
          actions={actions}
          fieldFocused={Boolean(focused)}
          fieldHovered={hovered}
          presence={presence}
          content={
            <FormFieldHeaderText
              description={description}
              inputId={inputId}
              title={title}
              validation={validation}
            />
          }
        />
      )}
      <div>{children}</div>
    </Stack>
  )
})
