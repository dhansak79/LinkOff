import { JSDOM } from 'jsdom';
import { setWorldConstructor } from '@cucumber/cucumber';

class FocusInWorld {
  constructor() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://www.linkedin.com/feed/',
      pretendToBeVisual: true,
    });
    this.document = dom.window.document;
    this.window = dom.window;
    this.chromeMock = this._makeChromeMock({});
  }

  _makeChromeMock(responses = {}) {
    return {
      runtime: {
        lastError: null,
        sendMessage: (msg, cb) => {
          for (const [key, value] of Object.entries(responses)) {
            if (msg[key]) return cb(value);
          }
          cb({ score: 0 });
        },
      },
      storage: {
        local: {
          get: (_keys, cb) => cb({ 'author-whitelist': [] }),
          set: () => {},
        },
      },
    };
  }

  setChromeMockResponses(responses) {
    this.chromeMock = this._makeChromeMock(responses);
  }

  buildFeedDOM(postContents) {
    const postDivs = postContents.map((c) => `<div>${c}</div>`).join('');
    this.document.body.innerHTML = `
      <div data-testid="mainFeed" data-component-type="LazyColumn" componentkey="container-update-list_mainFeed-lazy-container">
        <div data-lazy-mount-id="test-mount" style="display:contents">
          ${postDivs}
        </div>
      </div>`;
    return this.document.querySelectorAll('[data-testid="mainFeed"] > div[data-lazy-mount-id] > div');
  }
}

setWorldConstructor(FocusInWorld);
