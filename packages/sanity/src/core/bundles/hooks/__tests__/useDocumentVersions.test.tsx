import {describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'

import {type DocumentPreviewStore} from '../../../preview'
import {type BundleDocument} from '../../../store'
import {useDocumentVersions} from '../useDocumentVersions'

// Mock the entire module
jest.mock('../../../studio/source')

jest.mock('sanity', () => {
  const actual = jest.requireActual('sanity')
  return Object.assign({}, actual, {
    useClient: jest.fn(),
    useBundles: jest.fn(() => ({data: {}})),
    getPublishedId: jest.fn(),
    useDocumentPreviewStore: jest.fn(),
  })
})

const mockBundles = [
  {
    description: 'What a spring drop, allergies galore 🌸',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Spring Drop',
    icon: 'heart-filled',
    _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
    _type: 'bundle',
    slug: 'spring-drop',
    hue: 'magenta',
    _createdAt: '2024-07-02T11:37:51Z',
  },
  {
    description: 'What a winter drop',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Winter Drop',
    icon: 'heart-filled',
    _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
    _type: 'bundle',
    slug: 'winter-drop',
    hue: 'purple',
    _createdAt: '2024-07-02T11:37:51Z',
  },
] satisfies BundleDocument[]

async function setupMocks({
  bundles,
  versionIds,
}: {
  bundles: BundleDocument[]
  versionIds: string[]
}) {
  const sanityModule = await import('sanity')

  const useBundles = sanityModule.useBundles as jest.Mock<typeof sanityModule.useBundles>
  const useDocumentPreviewStore = sanityModule.useDocumentPreviewStore as jest.Mock<
    typeof sanityModule.useDocumentPreviewStore
  >

  useBundles.mockReturnValue({data: bundles, loading: false, dispatch: jest.fn()})

  useDocumentPreviewStore.mockReturnValue({
    unstable_observeDocumentIdSet: jest
      .fn<DocumentPreviewStore['unstable_observeDocumentIdSet']>()
      .mockReturnValue(of({status: 'connected', documentIds: versionIds})),
  } as unknown as DocumentPreviewStore)
}

describe('useDocumentVersions', () => {
  it('should return initial state', async () => {
    await setupMocks({bundles: mockBundles, versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    await setupMocks({bundles: mockBundles, versionIds: []})
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([])
  })

  it('should return the bundles if versions are found', async () => {
    await setupMocks({
      bundles: [mockBundles[0]],
      versionIds: ['spring-drop.document-1'],
    })
    const {result} = renderHook(() => useDocumentVersions({documentId: 'document-1'}))
    expect(result.current.data).toEqual([mockBundles[0]])
  })
})
