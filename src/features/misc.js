import {
  ADVERTISEMENT_CONTAINER_SELECTOR,
  FOLLOWS_SELECTOR,
  NEWS_MODULE_SELECTOR,
  NOTIFICATION_COUNT_SELECTOR,
  PREMIUM_IDENTITY_UPSELL_SELECTOR,
  PREMIUM_NAV_UPSELL_SELECTOR,
  UNFOLLOW_ALL_BUTTON_SELECTOR,
} from '../constants.js'
import {
  hideBySelector,
  hideParentBySelector,
  showBySelector,
  showParentBySelector,
  showAncestorIndexBySelector,
  hideAncestorIndexBySelector,
} from '../utils.js'

const handleAdvertisement = (config, mode) => {
  if (config['hide-advertisements']) {
    hideParentBySelector(ADVERTISEMENT_CONTAINER_SELECTOR, mode, false)
  } else {
    showParentBySelector(ADVERTISEMENT_CONTAINER_SELECTOR)
  }
}

const handleNotifications = (config) => {
  if (config['hide-notification-count']) {
    hideBySelector(NOTIFICATION_COUNT_SELECTOR, 'hide', false)
  } else {
    showBySelector(NOTIFICATION_COUNT_SELECTOR)
  }
}

const handleNews = (config, mode) => {
  if (config['hide-news']) {
    hideBySelector(NEWS_MODULE_SELECTOR, mode, false)
  } else {
    showBySelector(NEWS_MODULE_SELECTOR)
  }
}

const handlePremium = (config, mode) => {
  if (config['hide-premium']) {
    hideBySelector(PREMIUM_NAV_UPSELL_SELECTOR, mode, false)
    hideAncestorIndexBySelector(PREMIUM_IDENTITY_UPSELL_SELECTOR, 2, mode, false)
  } else {
    showBySelector(PREMIUM_NAV_UPSELL_SELECTOR)
    showAncestorIndexBySelector(PREMIUM_IDENTITY_UPSELL_SELECTOR, 2)
  }
}

const handleFollowRecommendations = (config, mode) => {
  if (config['hide-follow-recommendations']) {
    hideAncestorIndexBySelector(FOLLOWS_SELECTOR, 7, mode, false)
  } else {
    showAncestorIndexBySelector(FOLLOWS_SELECTOR, 7)
  }
}

const showAll = () => {
  showParentBySelector(ADVERTISEMENT_CONTAINER_SELECTOR)
  showBySelector(NOTIFICATION_COUNT_SELECTOR)
  showBySelector(NEWS_MODULE_SELECTOR)
  showBySelector(PREMIUM_NAV_UPSELL_SELECTOR)
  showAncestorIndexBySelector(PREMIUM_IDENTITY_UPSELL_SELECTOR, 2)
  showAncestorIndexBySelector(FOLLOWS_SELECTOR, 7)
}

const handleAll = (config, mode) => {
  handleFollowRecommendations(config, mode)
  handleNews(config, mode)
  handleNotifications(config)
  handlePremium(config, mode)
  handleAdvertisement(config, mode)
}

export const unfollowAll = async () => {
  const MAX_ROUNDS = 10
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const buttons = document.querySelectorAll(UNFOLLOW_ALL_BUTTON_SELECTOR)
    if (!buttons.length) {
      console.log('FocusedIn: Successfully unfollowed all')
      return
    }
    for (const button of buttons) {
      window.scrollTo(0, button.offsetTop - 260)
      button.click()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

export default (config) => {
  const enabled = config['main-toggle']
  const mode = 'hide'

  if (!enabled) {
    showAll()
    return
  }

  handleAll(config, mode)
}
