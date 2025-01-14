import {useContext} from 'react'
import {PaneLayoutContext} from 'sanity/_singletons'

import {type PaneLayoutContextValue} from './types'

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function usePaneLayout(): PaneLayoutContextValue {
  const pane = useContext(PaneLayoutContext)

  if (!pane) {
    throw new Error('PaneLayout: missing context value')
  }

  return pane
}
