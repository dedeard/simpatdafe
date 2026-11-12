import { accessHandlers } from './access'
import { assessmentHandlers } from './assessments'
import { bphtbHandlers } from './bphtb'
import { collectionHandlers } from './collections'
import { dashboardHandlers } from './dashboard'
import { paymentHandlers } from './payments'
import { pbbHandlers } from './pbb'
import { portHandlers } from './port'
import { reportHandlers } from './reports'
import { retributionHandlers } from './retributions'
import { settingsHandlers } from './settings'
import { sptpdHandlers } from './sptpd'
import { taxpayerHandlers } from './taxpayers'
import { tourismHandlers } from './tourism'

export const handlers = {
  ...taxpayerHandlers,
  ...sptpdHandlers,
  ...assessmentHandlers,
  ...paymentHandlers,
  ...collectionHandlers,
  ...tourismHandlers,
  ...portHandlers,
  ...retributionHandlers,
  ...pbbHandlers,
  ...bphtbHandlers,
  ...reportHandlers,
  ...settingsHandlers,
  ...dashboardHandlers,
  ...accessHandlers,
}

export type Handlers = typeof handlers
