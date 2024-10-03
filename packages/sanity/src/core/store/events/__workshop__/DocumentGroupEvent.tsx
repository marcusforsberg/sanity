/* eslint-disable react/jsx-no-bind */
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {Box, Card, Code, Container, Flex, Text, useToast} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {map, type Observable, of, startWith} from 'rxjs'
import {getDraftId, getPublishedId, useClient} from 'sanity'

import {Timeline} from '../../../../structure/panes/document/timeline/timeline'
import {Button} from '../../../../ui-components'
import {getDocumentEvents} from '../getDocumentEvents'
import {type DocumentGroupEvent} from '../types'

const query = {
  excludeContent: 'true',
  includeIdentifiedDocumentsOnly: 'true',
  tag: 'sanity.studio.structure.transactions',
  effectFormat: 'mendoza',
  excludeMutations: 'true',
  reverse: 'true',
  limit: '50',
}

export default function DocumentEvents() {
  const documentId = useString('Document Id', '') || ''
  const client = useClient()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const transactions$: Observable<TransactionLogEventWithEffects[]> = useMemo(() => {
    const dataset = client.config().dataset
    if (!documentId) return of([])

    const ids = [getPublishedId(documentId), getDraftId(documentId)]
    return client.observable
      .request({url: `/data/history/${dataset}/transactions/${ids.join(',')}?`, query})
      .pipe(
        map((result) =>
          result
            .toString('utf8')
            .split('\n')
            .filter(Boolean)
            .map((line: string) => JSON.parse(line)),
        ),
        startWith([]),
      )
  }, [client, documentId])

  const transactions = useObservable(transactions$, [])
  const events = getDocumentEvents(getPublishedId(documentId), transactions)
  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const selectedEvents = useMemo(() => {
    if (!selectedEventId) return []
    const event = events.find((e) => {
      if (e.type === 'document.editVersion' && e.mergedEvents) {
        // See if the selected event is a merged event
        return e.id === selectedEventId || e.mergedEvents.some((me) => me.id === selectedEventId)
      }
      return e.id === selectedEventId
    })
    if (event?.type === 'document.editVersion') {
      return [event.id, event.mergedEvents?.map((e) => e.id)].flat()
    }
    return [event?.id].filter(Boolean)
  }, [events, selectedEventId])

  const handleSelectItem = (event: DocumentGroupEvent) => {
    setSelectedEventId(event.id)
    // Find the node with `event.id` and scroll it into view
    const eventNode = document.getElementById(`event-${event.id}`)
    if (eventNode) {
      eventNode.scrollIntoView({behavior: 'instant', block: 'start'})
    }

    setTimeout(() => {
      const transactionNode = document.getElementById(`transaction-${event.id}`)
      if (transactionNode) {
        transactionNode.scrollIntoView({behavior: 'instant', block: 'start'})
      }
    }, 50)
  }

  const toast = useToast()
  return (
    <Box
      style={{
        height: 'calc(100% - 8px)',
        padding: '4px',
      }}
    >
      <Flex gap={3} direction="column" height="fill">
        <Card flex={1} border height={'fill'}>
          <Flex flex={1} height={'fill'}>
            <Container width={0} overflow="auto" height={'fill'}>
              <Flex direction={'column'} flex={1} gap={3} padding={3}>
                <Text size={2} weight="semibold">
                  History Timeline Items
                </Text>

                <Timeline
                  chunks={events}
                  hasMoreChunks={false}
                  lastChunk={selectedEvent}
                  onSelect={handleSelectItem}
                  onLoadMore={() => {}}
                />
              </Flex>
            </Container>

            <Card flex={1} borderLeft padding={3} overflow="auto">
              <Flex direction={'column'} flex={1}>
                <Flex paddingBottom={3} align={'center'} justify={'space-between'}>
                  <Text size={2} weight="semibold">
                    Events
                  </Text>
                  <Button
                    mode="ghost"
                    onClick={() => {
                      // Copy to clipboard the events
                      navigator.clipboard.writeText(JSON.stringify(events, null, 2))
                      toast.push({
                        closable: true,
                        status: 'success',
                        title: 'Events copied to clipboard',
                      })
                    }}
                    text="Copy to clipboard"
                  />
                </Flex>
                <Text size={0}>{events.length > 0 ? '[' : null}</Text>
                {events.map((event) => {
                  return (
                    <Box
                      padding={1}
                      key={event.id}
                      id={`event-${event.id}`}
                      onMouseEnter={() => setSelectedEventId(event.id)}
                      style={{
                        border: selectedEvents.includes(event.id)
                          ? '1px solid red'
                          : '1px solid transparent',
                      }}
                    >
                      <Code size={0} type="js" key={event.id}>
                        {JSON.stringify(event, null, 2)},
                      </Code>
                    </Box>
                  )
                })}
                <Text size={0}>{events.length > 0 ? ']' : null}</Text>
              </Flex>
            </Card>

            <Card flex={1} borderLeft padding={3} overflow="auto">
              <Flex paddingBottom={3} align={'center'} justify={'space-between'}>
                <Text size={2} weight="semibold">
                  Transactions
                </Text>
                <Button
                  mode="ghost"
                  onClick={() => {
                    // Copy to clipboard the transactions
                    navigator.clipboard.writeText(JSON.stringify(transactions, null, 2))
                    toast.push({
                      closable: true,
                      status: 'success',
                      title: 'Transactions copied to clipboard',
                    })
                  }}
                  text="Copy to clipboard"
                />
              </Flex>
              <Text size={0}>{transactions.length > 0 ? '[' : null}</Text>
              {transactions.map((transaction) => {
                return (
                  <Box
                    padding={1}
                    key={transaction.id}
                    id={`transaction-${transaction.id}`}
                    onMouseEnter={() => setSelectedEventId(transaction.id)}
                    style={{
                      border: selectedEvents.includes(transaction.id)
                        ? '1px solid red'
                        : '1px solid transparent',
                    }}
                  >
                    <Code size={0} key={transaction.id}>
                      {JSON.stringify(transaction, null, 2)},
                    </Code>
                  </Box>
                )
              })}
              <Text size={0}>{transactions.length > 0 ? ']' : null}</Text>
            </Card>
          </Flex>
        </Card>
      </Flex>
    </Box>
  )
}
