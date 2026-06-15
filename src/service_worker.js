import { classifyPost } from './features/classifier.js'

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (!req['classify-post']) return
  classifyPost(req['classify-post'])
    .then((result) => sendResponse({ result }))
    .catch(() => sendResponse({ result: null }))
  return true
})

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== 'install') return
  const res = await chrome.storage.local.get('initialized')
  if (res.initialized === 'v0.5') return
  await chrome.storage.local.set({
    initialized: 'v0.5',
    'main-toggle': true,
    'hide-whole-feed': false,
    'hide-by-age': 'week',
    'feed-keywords': '',
    'hide-liked': true,
    'hide-suggested': true,
    'sort-by-recent': true,
    'detect-slop': true,
    'hide-slop': false,
    'classify-posts': false,
    'hide-premium': true,
    'hide-advertisements': true,
    'hide-follow-recommendations': true,
    'hide-news': false,
    'hide-notification-count': false,
    'job-keywords': '',
    'hide-promoted-jobs': false,
  })
})
