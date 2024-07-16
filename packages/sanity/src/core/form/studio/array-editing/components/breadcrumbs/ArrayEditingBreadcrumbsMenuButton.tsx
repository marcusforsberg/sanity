import {Box, Card, Flex, Popover, type PopoverProps, Text, useClickOutside} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {cloneElement, type KeyboardEvent, type ReactElement, useCallback, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'
import {type Path} from 'sanity'
import {css, styled} from 'styled-components'

import {type ArrayEditingBreadcrumb} from '../../types'
import {ArrayEditingBreadcrumbsMenu} from './ArrayEditingBreadcrumbsMenu'
import {ITEM_HEIGHT, MAX_DISPLAYED_ITEMS} from './constants'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom-start']

const RootFlex = styled(Flex)``

const TitleCard = styled(Card)`
  min-height: max-content;
`

const PopoverListFlex = styled(Flex)<{
  $maxDisplayedItems: number
  $itemHeight: number
}>((props) => {
  const {$maxDisplayedItems, $itemHeight} = props

  return css`
    --item-height: ${$itemHeight}px;
    --max-items: ${$maxDisplayedItems};
    --list-padding: 0.5rem;

    position: relative;
    max-height: calc(var(--item-height) * var(--max-items) + var(--list-padding));
    min-height: calc((var(--item-height) * 1));
  `
})

const StyledPopover = styled(Popover)(() => {
  return css`
    [data-ui='Popover__wrapper'] {
      width: 250px;
      display: flex;
      flex-direction: column;
      border-radius: ${({theme}) => theme.sanity.radius[3]}px;
      position: relative;
      overflow: hidden;
      overflow: clip;
    }
  `
})

interface ArrayEditingBreadcrumbsMenuButtonProps {
  button: ReactElement
  collapsed?: boolean
  items: ArrayEditingBreadcrumb[]
  menuTitle?: string
  onPathSelect: (path: Path) => void
  parentElement: HTMLElement | null
  selectedPath: Path
}

export function ArrayEditingBreadcrumbsMenuButton(
  props: ArrayEditingBreadcrumbsMenuButtonProps,
): JSX.Element {
  const {
    button,
    collapsed = false,
    items,
    menuTitle,
    onPathSelect,
    parentElement,
    selectedPath,
  } = props
  const [open, setOpen] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const closeAndFocus = useCallback(() => {
    if (!open) return

    setOpen(false)
    buttonElement?.focus()
  }, [buttonElement, open])

  const handlePopoverKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const {key, shiftKey} = event

      if ((shiftKey && key === 'Tab') || key === 'Escape' || key === 'Tab') {
        closeAndFocus()
      }
    },
    [closeAndFocus],
  )

  const handleButtonClick = useCallback(() => {
    const next = !open

    setOpen(next)
  }, [open])

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathSelect(path)
      setOpen(false)
    },
    [onPathSelect],
  )

  useClickOutside(() => setOpen(false), [rootElement, buttonElement])

  const content = (
    <RootFlex direction="column" flex={1} forwardedAs={ReactFocusLock} height="fill" returnFocus>
      <PopoverListFlex
        $itemHeight={ITEM_HEIGHT}
        $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
        direction="column"
        overflow="hidden"
      >
        {menuTitle && (
          <TitleCard borderBottom padding={3} sizing="border">
            <Box paddingX={1} sizing="border">
              <Text muted size={1} textOverflow="ellipsis" weight="semibold" title={menuTitle}>
                {menuTitle}
              </Text>
            </Box>
          </TitleCard>
        )}

        <ArrayEditingBreadcrumbsMenu
          collapsed={collapsed}
          items={items}
          onPathSelect={handlePathSelect}
          selectedPath={selectedPath}
        />
      </PopoverListFlex>
    </RootFlex>
  )

  const clonedButton = cloneElement(button, {
    'aria-expanded': open,
    'aria-haspopup': 'true',
    'data-testid': 'array-editing-breadcrumb-menu-button',
    'id': 'Array-breadcrumb-menu-button',
    'onClick': handleButtonClick,
    'ref': setButtonElement,
    'selected': open,
  })

  return (
    <StyledPopover
      animate
      constrainSize
      content={content}
      data-testid="array-editing-breadcrumbs-menu-popover"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      onKeyDown={handlePopoverKeyDown}
      open={open}
      placement="bottom-start"
      portal
      ref={setRootElement}
      referenceBoundary={parentElement}
    >
      {clonedButton}
    </StyledPopover>
  )
}