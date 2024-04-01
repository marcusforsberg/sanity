import {useCallback} from 'react'
import {useDocumentPane} from 'sanity/structure'

import {type DocumentLayoutProps} from '../../../config/types'
import {useCommentsEnabled} from '../..'
import {COMMENTS_INSPECTOR_NAME} from '../../constants'
import {CommentsAuthoringPathProvider} from '../../context/authoring-path/CommentsAuthoringPathProvider'
import {CommentsProvider} from '../../context/comments/CommentsProvider'
import {CommentsEnabledProvider} from '../../context/enabled/CommentsEnabledProvider'
import {CommentsSelectedPathProvider} from '../../context/selected-path/CommentsSelectedPathProvider'

export function CommentsDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsDocumentLayoutInner {...props} />
    </CommentsEnabledProvider>
  )
}

function CommentsDocumentLayoutInner(props: DocumentLayoutProps) {
  const {documentId, documentType} = props
  const commentsEnabled = useCommentsEnabled()
  const {openInspector, inspector} = useDocumentPane()

  const handleOpenCommentsInspector = useCallback(() => {
    if (inspector?.name === COMMENTS_INSPECTOR_NAME) return

    openInspector(COMMENTS_INSPECTOR_NAME)
  }, [inspector?.name, openInspector])

  // If comments are not enabled, render the default document layout
  if (!commentsEnabled.enabled) {
    return props.renderDefault(props)
  }

  return (
    <CommentsProvider
      documentId={documentId}
      documentType={documentType}
      isCommentsOpen={inspector?.name === COMMENTS_INSPECTOR_NAME}
      onCommentsOpen={handleOpenCommentsInspector}
      sortOrder="desc"
      type="field"
    >
      <CommentsSelectedPathProvider>
        <CommentsAuthoringPathProvider>{props.renderDefault(props)}</CommentsAuthoringPathProvider>
      </CommentsSelectedPathProvider>
    </CommentsProvider>
  )
}
