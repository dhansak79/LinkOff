import { JOB_SELECTORS } from '../constants.js'
import { resetJobs } from '../utils.js'

const JOB_SELECTOR_STRING = JOB_SELECTORS.join(',')

let jobKeywordInterval = null

export const getJobKeywords = (config) => {
  const keywords =
    config['job-keywords'] === '' ? [] : config['job-keywords'].split(',')

  if (config['hide-promoted-jobs']) {
    keywords.push('Promoted')
  }

  console.log('FocusedIn: Current job keywords are', keywords)
  return keywords
}

const blockByJobKeywords = (keywords, mode) => {
  if (!window.location.pathname.startsWith('/jobs/')) return
  if (!keywords.length) return

  jobKeywordInterval = setInterval(() => {
    document.querySelectorAll(JOB_SELECTOR_STRING).forEach((post) => {
      const found = keywords.find(
        (keyword) => post.textContent.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
      )
      if (found) {
        post.classList.add(mode, 'showIcon')
      } else {
        post.classList.remove('hide', 'dim', 'showIcon')
      }
    })
  }, 350)
}

export default (config) => {
  const enabled = config['main-toggle']
  const mode = config['gentle-mode'] ? 'dim' : 'hide'

  clearInterval(jobKeywordInterval)
  jobKeywordInterval = null
  resetJobs()

  if (!enabled) return

  blockByJobKeywords(getJobKeywords(config), mode)
}
