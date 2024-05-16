/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Button, Card, Code, Dialog, Flex, Text} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {debounce, type DebounceSettings, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  FormInput,
  type InputProps,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
} from 'sanity'
import styled, {css} from 'styled-components'

import {
  buildTreeEditingState,
  type BuildTreeEditingStateProps,
  EMPTY_TREE_STATE,
  shouldArrayDialogOpen,
  type TreeEditingState,
} from '../utils'
import {handleNavigate} from '../utils/handleNavigate'
import {TreeEditingLayout} from './TreeEditingLayout'

const DEBUG_RELATIVE_PATH = false

const EMPTY_ARRAY: [] = []

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const ANIMATION_TRANSITION: Transition = {duration: 0.2, ease: 'easeInOut'}

const DEBOUNCE_SETTINGS: DebounceSettings = {leading: true, trailing: true}

function renderDefault(props: InputProps) {
  return props.renderDefault(props)
}

const StyledDialog = styled(Dialog)(({theme}: {theme: Theme}) => {
  const spacing = theme.sanity.v2?.space[4]

  return css`
    [data-ui='DialogCard'] {
      padding: ${spacing}px;
      box-sizing: border-box;
    }

    [data-ui='Card']:first-child {
      flex: 1;
    }
  `
})

const MotionFlex = motion(Flex)

interface TreeEditingDialogProps {
  focusPath: Path
  schemaType: ObjectSchemaType
  setFocusPath: (path: Path) => void
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
}

export function TreeEditingDialog(props: TreeEditingDialogProps): JSX.Element | null {
  const {focusPath, rootInputProps, schemaType, setFocusPath} = props
  const {value} = rootInputProps

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)
  const focusPathRef = useRef<Path | null>(null)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)

  const handleBuildTreeEditingState = useCallback(
    (opts: BuildTreeEditingStateProps) => {
      const nextState = buildTreeEditingState(opts)

      if (isEqual(nextState, treeState)) return

      // If the next state has no relative path, we want to keep the current relative path
      const hasNoRelativePath = nextState.relativePath.length === 0
      const nextRelativePath = hasNoRelativePath ? treeState.relativePath : nextState.relativePath

      setTreeState({...nextState, relativePath: nextRelativePath})
    },
    [treeState],
  )

  const debouncedBuildTreeEditingState = useMemo(
    () => debounce(handleBuildTreeEditingState, 1000, DEBOUNCE_SETTINGS),
    [handleBuildTreeEditingState],
  )

  const onClose = useCallback(() => {
    setFocusPath(EMPTY_ARRAY)
    setTreeState(EMPTY_TREE_STATE)
    debouncedBuildTreeEditingState.cancel()
  }, [debouncedBuildTreeEditingState, setFocusPath])

  useEffect(() => {
    if (focusPath.length === 0) return

    /** it should only proceed if the focus path presented makes sense for the editing dialog */
    if (!shouldArrayDialogOpen(schemaType, focusPath)) return
    const focusPathChanged = !isEqual(focusPath, focusPathRef.current)
    const valueChanged = !isEqual(value, valueRef.current)

    // Only proceed with building the tree editing state if the
    // focusPath or the value has changed.
    if (!focusPathChanged && !valueChanged) return

    // Store the focusPath and value to be able to compare them
    // with the next focusPath and value.
    focusPathRef.current = focusPath
    valueRef.current = value

    debouncedBuildTreeEditingState({
      schemaType,
      documentValue: value,
      focusPath,
    })
  }, [focusPath, schemaType, value, debouncedBuildTreeEditingState])

  const {menuItems, relativePath, rootTitle, breadcrumbs} = treeState

  const open = useMemo(
    () => shouldArrayDialogOpen(schemaType, relativePath),
    [relativePath, schemaType],
  )

  const onHandlePathSelect = useCallback(
    (path: Path) => {
      // Cancel any debounced state building when navigating.
      // This is done to allow for immediate navigation to the selected path
      // and not wait for the debounced state to be built.
      // The debounced state is primarily used to avoid building the state
      // on every document value or focus path change.
      debouncedBuildTreeEditingState.cancel()
      handleNavigate(path, setFocusPath)
    },
    [debouncedBuildTreeEditingState, setFocusPath],
  )

  if (!open || relativePath.length === 0) return null

  return (
    <StyledDialog
      autoFocus={false}
      id="tree-editing-dialog"
      onClickOutside={onClose}
      padding={0}
      width={3}
    >
      <TreeEditingLayout
        breadcrumbs={breadcrumbs}
        items={menuItems}
        onPathSelect={onHandlePathSelect}
        selectedPath={relativePath}
        title={rootTitle}
        footer={
          <Card borderTop>
            <Flex align="center" justify="flex-end" paddingX={3} paddingY={2} sizing="border">
              <Button text="Done" onClick={onClose} />
            </Flex>
          </Card>
        }
      >
        {DEBUG_RELATIVE_PATH && (
          <Card
            padding={3}
            radius={2}
            margin={2}
            marginBottom={5}
            sizing="border"
            tone="transparent"
            flex={1}
            shadow={1}
            scheme="dark"
          >
            <Flex direction="column" gap={3}>
              <Text size={1} weight="medium">
                Relative path:
              </Text>

              <Card padding={2} tone="transparent" shadow={1}>
                <Code size={1} language="json">
                  {JSON.stringify(relativePath)}
                </Code>
              </Card>
            </Flex>

            <Flex direction="column" gap={3} marginTop={4}>
              <Text size={1} weight="medium">
                Focus path:
              </Text>

              <Card padding={2} tone="transparent" shadow={1}>
                <Code size={1} language="json">
                  {JSON.stringify(focusPath)}
                </Code>
              </Card>
            </Flex>
          </Card>
        )}

        <AnimatePresence mode="wait">
          <MotionFlex
            animate="animate"
            direction="column"
            exit="exit"
            height="fill"
            initial="initial"
            key={toString(relativePath)}
            overflow="hidden"
            transition={ANIMATION_TRANSITION}
            variants={ANIMATION_VARIANTS}
          >
            <FormInput
              {...rootInputProps}
              relativePath={relativePath}
              renderDefault={renderDefault}
            />
          </MotionFlex>
        </AnimatePresence>
      </TreeEditingLayout>
    </StyledDialog>
  )
}