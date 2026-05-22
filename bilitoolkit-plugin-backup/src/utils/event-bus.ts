import mitt from 'mitt'

type Events = {
  refreshTaskGroups: void
}

export const eventBus = mitt<Events>()
