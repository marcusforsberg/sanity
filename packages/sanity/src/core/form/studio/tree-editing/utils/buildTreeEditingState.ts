import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getSchemaTypeTitle,
  getValueAtPath,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isPrimitiveSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'
import {getRootPath} from './getRootPath'
import {getSchemaField} from './getSchemaField'

const EMPTY_ARRAY: [] = []

export const EMPTY_TREE_STATE: TreeEditingState = {
  breadcrumbs: EMPTY_ARRAY,
  menuItems: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
  rootTitle: '',
}

export interface BuildTreeEditingStateProps {
  schemaType: ObjectSchemaType | ArraySchemaType
  documentValue: unknown
  focusPath: Path
}

export interface TreeEditingState {
  breadcrumbs: TreeEditingBreadcrumb[]
  menuItems: TreeEditingMenuItem[]
  relativePath: Path
  rootTitle: string
}

interface RecursiveProps extends Omit<BuildTreeEditingStateProps, 'focusPath'> {
  path: Path
  initial: boolean
}

function isSelected(itemPath: Path, focusPath: Path): boolean {
  return JSON.stringify(itemPath) === JSON.stringify(focusPath)
}

/**
 * Check if the path is an array item path
 */
function isArrayItemPath(path: Path): boolean {
  return path[path.length - 1].hasOwnProperty('_key')
}

/**
 * Check if the item should be in the breadcrumb
 */
function shouldBeInBreadcrumb(itemPath: Path, focusPath: Path): boolean {
  return (
    itemPath.every((segment, index) => {
      return JSON.stringify(focusPath[index]) === JSON.stringify(segment)
    }) && isArrayItemPath(itemPath)
  )
}

export function buildTreeEditingState(props: BuildTreeEditingStateProps): TreeEditingState {
  const {focusPath} = props
  const menuItems: TreeEditingMenuItem[] = []

  const rootPath = getRootPath(focusPath)
  const rootField = getSchemaField(props.schemaType, toString(rootPath)) as ObjectSchemaType
  const rootTitle = getSchemaTypeTitle(rootField?.type as ObjectSchemaType)

  const breadcrumbs: TreeEditingBreadcrumb[] = []
  let relativePath: Path = []

  if (JSON.stringify(rootPath) === JSON.stringify(focusPath)) {
    return EMPTY_TREE_STATE
  }

  recursive({
    initial: true,
    schemaType: rootField,
    documentValue: props.documentValue,
    path: rootPath,
  })

  function recursive(recursiveProps: RecursiveProps): TreeEditingState {
    const {schemaType, path, initial, documentValue} = recursiveProps

    if (schemaType.type?.jsonType === 'object') {
      const items = schemaType?.type?.fields?.map((field) => {
        const nextPath = [...path, field.name]
        const objectTitle = getSchemaTypeTitle(schemaType)

        if (shouldBeInBreadcrumb(nextPath, focusPath)) {
          breadcrumbs.push({
            path: nextPath,
            title: objectTitle,
            children: EMPTY_ARRAY,
          })
        }

        return {
          title: objectTitle,
          path: nextPath,
          children: EMPTY_ARRAY,
        }
      })

      return {
        menuItems: items,
        relativePath,
        breadcrumbs: EMPTY_ARRAY,
        rootTitle: '',
      }
    }

    if (isArraySchemaType(schemaType.type) && !initial) {
      const arrayValue = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>

      const nestedItems: TreeEditingMenuItem[] = arrayValue?.map((item) => {
        const itemPath = [...path, {_key: item._key}] as Path
        const itemType = item?._type as string

        const itemSchemaField = (schemaType.type as ArraySchemaType)?.of?.find(
          (type) => type.name === itemType,
        ) as ObjectSchemaType

        const previewTitleKey = itemSchemaField?.preview?.select?.title
        const title = previewTitleKey ? item?.[previewTitleKey] : itemType

        const childrenFields = itemSchemaField?.fields || []
        const childrenMenuItems: TreeEditingMenuItem[] = []

        const isArrayPath = isArrayItemPath(itemPath)

        if (isSelected(itemPath, focusPath)) {
          const nextPath = isArrayPath ? itemPath : itemPath.slice(0, itemPath.length - 1)
          relativePath = nextPath
        }

        if (shouldBeInBreadcrumb(itemPath, focusPath)) {
          breadcrumbs.push({
            path: itemPath,
            title: (title || 'Untitled') as string,

            children: arrayValue.map((arrayItem) => {
              const nestedItemPath = [...path, {_key: arrayItem._key}] as Path
              const nestedItemType = arrayItem?._type as string

              const nestedItemSchemaField = (schemaType.type as ArraySchemaType)?.of?.find(
                (type) => type.name === nestedItemType,
              ) as ObjectSchemaType

              const nestedPreviewTitleKey = nestedItemSchemaField?.preview?.select?.title
              const nestedTitle = nestedPreviewTitleKey
                ? arrayItem?.[nestedPreviewTitleKey]
                : nestedItemType

              return {
                path: nestedItemPath,
                title: nestedTitle as string,
                children: EMPTY_ARRAY,
              }
            }),
          })
        }

        childrenFields.forEach((childField) => {
          const childPath = [...itemPath, childField.name] as Path

          const isPrimitiveChild = isPrimitiveSchemaType(childField?.type)
          const childTitle = getSchemaTypeTitle(childField.type) as string
          const childValue = getValueAtPath(documentValue, childPath)
          const isChildArrayPath = isArrayItemPath(childPath)

          if (isSelected(childPath, focusPath)) {
            const nextPath = isChildArrayPath ? childPath : childPath.slice(0, childPath.length - 1)

            relativePath = nextPath
          }

          if (!isPrimitiveChild && childValue) {
            if (shouldBeInBreadcrumb(childPath, focusPath)) {
              breadcrumbs.push({
                path: childPath,
                title: childTitle,
                children: EMPTY_ARRAY,
              })
            }

            const childState = recursive({
              schemaType: childField as ObjectSchemaType,
              documentValue,
              path: childPath,
              initial: false,
            })

            childrenMenuItems.push({
              title: childTitle,
              path: childPath,
              children: childState?.menuItems || EMPTY_ARRAY,
            })
          }
        })

        return {
          path: itemPath,
          title: (title || 'Untitled') as string,
          children: childrenMenuItems,
        }
      })

      return {
        menuItems: nestedItems,
        relativePath,
        breadcrumbs: EMPTY_ARRAY,
        rootTitle: '',
      }
    }

    const value = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>

    const arrayValue = Array.isArray(value) ? value : EMPTY_ARRAY
    const arraySchemaType = schemaType?.type as ArraySchemaType

    arrayValue.forEach((item) => {
      const itemPath = [...rootPath, {_key: item._key}] as Path
      const itemType = item?._type as string

      const itemSchemaField = arraySchemaType?.of?.find(
        (type) => type.name === itemType,
      ) as ObjectSchemaType

      const previewTitleKey = itemSchemaField?.preview?.select?.title
      const title = previewTitleKey ? item?.[previewTitleKey] : getSchemaTypeTitle(itemSchemaField)

      const childrenFields = itemSchemaField?.fields || []
      const childrenMenuItems: TreeEditingMenuItem[] = []

      if (shouldBeInBreadcrumb(itemPath, focusPath)) {
        breadcrumbs.push({
          path: itemPath,
          title: (title || 'Untitled') as string,
          children: arrayValue.map((arrayItem) => {
            const nestedItemPath = [...rootPath, {_key: arrayItem._key}] as Path
            const nestedItemType = arrayItem?._type as string

            const nestedItemSchemaField = arraySchemaType?.of?.find(
              (type) => type.name === nestedItemType,
            ) as ObjectSchemaType

            const nestedPreviewTitleKey = nestedItemSchemaField?.preview?.select?.title
            const nestedTitle = nestedPreviewTitleKey
              ? arrayItem?.[nestedPreviewTitleKey]
              : getSchemaTypeTitle(nestedItemSchemaField)

            return {
              path: nestedItemPath,
              title: nestedTitle as string,
              children: EMPTY_ARRAY,
            }
          }),
        })
      }

      childrenFields.forEach((childField) => {
        const childPath = [...itemPath, childField.name] as Path

        const isPrimitive = isPrimitiveSchemaType(childField?.type)
        const childTitle = getSchemaTypeTitle(childField.type) as string
        const childValue = getValueAtPath(documentValue, childPath)
        const isArrayPath = isArrayItemPath(childPath)

        if (isSelected(childPath, focusPath)) {
          const nextPath = isArrayPath ? childPath : childPath.slice(0, childPath.length - 1)

          relativePath = nextPath
        }

        if (
          !isPrimitive &&
          !isArrayOfPrimitivesSchemaType(childField.type) &&
          isArraySchemaType(childField.type) &&
          childValue
        ) {
          if (shouldBeInBreadcrumb(childPath, focusPath)) {
            breadcrumbs.push({
              path: childPath,
              title: childTitle,
              children: EMPTY_ARRAY,
            })
          }

          const childState = recursive({
            schemaType: childField as ObjectSchemaType,
            documentValue,
            path: childPath,
            initial: false,
          })

          childrenMenuItems.push({
            title: getSchemaTypeTitle(childField.type) as string,
            path: childPath,
            children: childState?.menuItems || EMPTY_ARRAY,
          })
        }
      })

      const isPrimitive = isPrimitiveSchemaType(itemSchemaField?.type)
      const isArrayPath = isArrayItemPath(itemPath)

      if (isSelected(itemPath, focusPath)) {
        const nextPath = isArrayPath ? itemPath : itemPath.slice(0, itemPath.length - 1)

        relativePath = nextPath
      }

      if (!isPrimitive) {
        menuItems.push({
          title: (title || 'Untitled') as string,
          path: itemPath as Path,
          children: childrenMenuItems,
        })
      }
    })

    return {
      breadcrumbs: EMPTY_ARRAY,
      menuItems,
      relativePath,
      rootTitle: '',
    }
  }

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle,
  }
}
