'use strict'

// Prevent duplicate initialization (e.g. re-injection); avoids spawning extra contexts/workers
if (self.__focusedinInit) {
  // already initialized, do nothing
} else {
  self.__focusedinInit = true

  // Dynamically import the extension's main code as an ES module
  const src = chrome.runtime.getURL('src/index.js')

  import(src).catch((e) => {
    console.error('Failed to import FocusedIn extension index.js:', e)
  })
}
