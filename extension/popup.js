function runOnNetflixTab(tab) {
  const NETFLIX_WATCH_REGEX = /netflix\.com\/watch\/\d*/gi;
  const WATCH_TRACK_REGEX = /watch\/\d*/gi;
  const TRACK_ID_REGEX = /\d.*/gi;
  const GMT_TIMESTAMP_REGEX = /\d.*/gi;
  const SYNC_GMT_TIMESTAMP_PARAM = 'syncGMTTimestampSec';
  const SYNC_GMT_TIMESTAMP_REGEX = new RegExp('[\\?&]' + SYNC_GMT_TIMESTAMP_PARAM + '=([^&#]*)');

  const USE_NETWORK_TIME = false; // TODO: FIX WITHIN POPUP
  const GMT_URL = 'http://worldclockapi.com/api/json/gmt/now';
  const EXTENSION_LINK = 'https://github.com/debkbanerji/netflix-sync-extension';

  const MS_IN_SEC = 1000;

  const url = tab.url;

  // hide all possible views, then show the one we want to view
  document.getElementById('synced-video-view').hidden = true
  document.getElementById('unsynced-video-view').hidden = true;
  document.getElementById('non-video-view').hidden = true;

  let trackID = null;

  if (NETFLIX_WATCH_REGEX.test(url)) {
    if (SYNC_GMT_TIMESTAMP_REGEX.test(url)) {
      document.getElementById('synced-video-view').hidden = false;

      document.getElementById('resync').addEventListener('click', () => {
        chrome.tabs.reload(tab.id);
      });

      document.getElementById('copy-on-synced-url').addEventListener('click', () => {
        navigator.clipboard.writeText(url);
      });

      const timestampGMTMatch = SYNC_GMT_TIMESTAMP_REGEX.exec(url)[0];
      const timestampGMT = parseInt(GMT_TIMESTAMP_REGEX.exec(timestampGMTMatch)[0]) * MS_IN_SEC;

      document.getElementById('scheduled-start-time-gmt').innerHTML = new Date(timestampGMT).toLocaleString() + ' (Your Time Zone)';

    } else {
      document.getElementById('unsynced-video-view').hidden = false;

      // get track ID
      const trackIDMatch = WATCH_TRACK_REGEX.exec(url)[0];
      const trackID = TRACK_ID_REGEX.exec(trackIDMatch)[0];

      document.getElementById('copy-extension-link').addEventListener('click', () => {
        navigator.clipboard.writeText(EXTENSION_LINK);
      });

      let targetGMTTs = null;

      document.getElementById('time-selector-dropdown').addEventListener('change', () => {
        document.getElementById('start-time-select-prompt').hidden = true;

        const startTimeOffset = document.getElementById('time-selector-dropdown').value;

        let fetchTimePromise = new Promise((resolve, reject) => {
          resolve({
            currentDateTime: (new Date(Date.now())).toUTCString()
          });
        });

        if (USE_NETWORK_TIME) {
          // Get the current time from the web to avoid issues with computers that
          // have incorrectly set time
          fetchTimePromise = fetch(GMT_URL)
            .then((response) => {
              return response.json();
            });
        }

        fetchTimePromise.then((data) => {
            const startTimeOffset = document.getElementById('time-selector-dropdown').value
            const targetGMTTs = Date.parse(data.currentDateTime) / MS_IN_SEC + parseInt(startTimeOffset);

            document.getElementById('time-selector-dropdown').hidden = true;
            document.getElementById('selected-start-time-gmt').hidden = false;
            document.getElementById('selected-start-time-gmt').innerHTML = new Date(targetGMTTs * MS_IN_SEC).toLocaleString() + ' (Your Time Zone)';

            const watchPartyLink = 'https://www.netflix.com/watch/' + trackID + '?syncGMTTimestampSec=' + targetGMTTs
            // document.getElementById('watch-party-link').hidden = false;
            // document.getElementById('watch-party-link').innerHTML = watchPartyLink.replace('https://','');
            // document.getElementById('watch-party-link').href = watchPartyLink;
            // document.getElementById('watch-party-link').addEventListener('click', () => {
            //   chrome.tabs.update({
            //     url: watchPartyLink
            //   });
            // });
            document.getElementById('copy-not-on-synced-url').hidden = false;
            document.getElementById('copy-not-on-synced-url').addEventListener('click', () => {
              navigator.clipboard.writeText(watchPartyLink);
            });
          });
      });
    }
  } else {
    document.getElementById('non-video-view').hidden = false;
  }
}

chrome.tabs.query({
  active: true,
  currentWindow: true
}, (tabs) => {
  // attach the extension logic to currently opened tab
  const targetTab = tabs[0];
  const targetTabID = targetTab.id;
  runOnNetflixTab(targetTab);

  // whenever the url of this tab changes, rerun this
  chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
    if (tabID === targetTabID && changeInfo.status === 'complete') {
      runOnNetflixTab(tab);
    }
  });
});
