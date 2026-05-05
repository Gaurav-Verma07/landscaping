export { customerTools } from './customers-tools'
export { campaignTools } from './campaigns-tools'
export { communicationTools } from './communications-tools'
export { projectTools } from './projects-tools'
export { navigationTools } from './navigation-tools'

import { customerTools } from './customers-tools'
import { campaignTools } from './campaigns-tools'
import { communicationTools } from './communications-tools'
import { projectTools } from './projects-tools'
import { navigationTools } from './navigation-tools'

export const allTools = [
  ...customerTools,
  ...campaignTools,
  ...communicationTools,
  ...projectTools,
  ...navigationTools,
]