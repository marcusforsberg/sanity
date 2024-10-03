import {
  AddIcon,
  CalendarIcon,
  CircleIcon,
  CloseIcon,
  EditIcon,
  type IconComponent,
  PublishIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {type ThemeColorAvatarColorKey} from '@sanity/ui/theme'

import {type DocumentVersionEventType} from '../../../../core/store/events/types'

export const TIMELINE_ICON_COMPONENTS: Record<DocumentVersionEventType, IconComponent> = {
  'document.createVersion': AddIcon,
  'document.createLive': AddIcon,
  'document.deleteGroup': TrashIcon,
  'document.deleteVersion': CloseIcon,
  'document.editVersion': EditIcon,
  'document.updateLive': EditIcon,
  'document.publishVersion': PublishIcon,
  'document.unpublish': UnpublishIcon,
  'document.scheduleVersion': CalendarIcon,
  'document.unscheduleVersion': CircleIcon,
}

export const TIMELINE_ITEM_EVENT_TONE: Record<
  DocumentVersionEventType | 'withinSelection',
  ThemeColorAvatarColorKey
> = {
  'document.createVersion': 'blue',
  'document.publishVersion': 'green',
  'document.createLive': 'green',
  'document.updateLive': 'green',
  'document.editVersion': 'yellow',
  'document.unpublish': 'orange',
  'document.deleteVersion': 'orange',
  'document.deleteGroup': 'red',
  'document.scheduleVersion': 'yellow',
  'document.unscheduleVersion': 'yellow',

  // What does this represents?
  'withinSelection': 'magenta',
}
