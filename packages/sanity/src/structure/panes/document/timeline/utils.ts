import {
  type DocumentGroupEvent,
  type documentVersionEventTypes,
  type PublishDocumentVersionEvent,
} from '../../../../core/store/events/types'

export type NonPublishChunk = Omit<DocumentGroupEvent, 'type'> & {
  type: Exclude<(typeof documentVersionEventTypes)[number], 'document.publishVersion'>
  metadata: {
    parentId?: string
  }
}

export type PublishChunk = PublishDocumentVersionEvent & {
  type: 'document.publishVersion'
  metadata: {
    parentId?: undefined
    children: string[]
    collaborators: Set<string>
  }
}

export const isPublishChunk = (
  event: DocumentGroupEvent | CollapsibleEvent,
): event is PublishChunk => event.type === 'document.publishVersion'

export const isNonPublishChunk = (
  event: DocumentGroupEvent | CollapsibleEvent,
): event is NonPublishChunk => event.type !== 'document.publishVersion'

/**
 * searches for the previous publish action in the list of events
 * e.g. events = [publish, edit, publish, edit, edit] it needs to return the second publish action
 * e.g. events = [publish, edit, delete, edit, edit] it returns undefined
 */

function getPreviousPublishAction(chunks: CollapsibleEvent[]) {
  let previousPublish: PublishChunk | null = null
  // We need to iterate from the end to the start of the list
  for (let index = chunks.length - 1; index >= 0; index--) {
    const chunk = chunks[index]
    if (isPublishChunk(chunk)) {
      previousPublish = chunk
      break
    }
    if (chunk.type === 'document.editVersion') {
      continue
    } else break
  }

  return previousPublish
}
export type CollapsibleEvent = NonPublishChunk | PublishChunk

/**
 * Takes an array of chunks and adds them metadata necessary for the timeline view.
 * for draft chunks, it will add the parentId of the published chunk if this draft action is now published
 * for published, it will add the children array and the collaborators array
 */
export function addChunksMetadata(chunks: DocumentGroupEvent[]): CollapsibleEvent[] {
  const result: CollapsibleEvent[] = []

  for (const chunk of chunks) {
    if (isPublishChunk(chunk)) {
      result.push({
        ...chunk,
        metadata: {
          children: [],
          collaborators: new Set(), // Initialize the collaborators array
        },
      })
      continue
    }
    if (isNonPublishChunk(chunk)) {
      const previousPublish = getPreviousPublishAction(result)
      if (chunk.type === 'document.editVersion' && previousPublish) {
        if (previousPublish.author !== chunk.author) {
          previousPublish.metadata.collaborators.add(chunk.author)
        }

        previousPublish.metadata.children.push(chunk.id)
        result.push({
          ...chunk,
          metadata: {
            parentId: previousPublish.id,
          },
        })
        continue
      }
    }
    if (isNonPublishChunk(chunk)) {
      result.push({...chunk, metadata: {}})
    }
  }

  return result
}
