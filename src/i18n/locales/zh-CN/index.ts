import common from './common'
import errors from './errors'
import tabs from './tabs'
import language from './language'
import auth from './auth'
import profile from './profile'
import distance from './distance'
import map from './map'
import budget from './budget'
import ships from './ships'
import legacy from './legacy'
import report from './report'

/**
 * Simplified Chinese messages, grouped by feature area.
 * Keep the tree shape identical to `en-US` (checked by `npm run i18n:check`).
 */
export default {
  common,
  errors,
  tabs,
  language,
  auth,
  profile,
  distance,
  map,
  budget,
  ships,
  legacy,
  report,
}
