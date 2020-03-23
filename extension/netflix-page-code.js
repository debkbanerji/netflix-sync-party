function embeddedCode() {
  const syncStates = {
    UNINITIALIZED: 'uninitialized',
    WAITING_FOR_START: 'waiting_for_start',
    STARTED: 'started'
  }

  // Have to define constants in this function

  const TIME_BEFORE_RUN = 1000; // Give Netflix this much time to load
  // TODO: Do this reactively rather than guessing

  const SYNC_GMT_TIMESTAMP_PARAM = 'syncGMTTimestamp';
  const SYNC_GMT_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_GMT_TIMESTAMP_PARAM + "=([^&#]*)");

  const SYNC_VIDEO_TIMESTAMP_PARAM = 'syncVideoTimestamp';
  const SYNC_VIDEO_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_VIDEO_TIMESTAMP_PARAM + "=([^&#]*)");


  function getPlayer() {
    console.log(window);

    try {
      const videoPlayer = netflix
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer;

      // Getting player id
      const playerSessionId = videoPlayer
        .getAllPlayerSessionIds()[0];

      const player = videoPlayer
        .getVideoPlayerBySessionId(playerSessionId);

      return player;
    } catch (err) {
      alert("Netflix link sync unable to access player on page")
      console.error(err);
    }
  }

  function onNetflixLoad() {
    let state = syncStates.UNINITIALIZED;

    const videoPlayer = getPlayer();

    while (state !== syncStates.STARTED) {
      state = syncStates.STARTED; // escape
    }
    // the video has started - don't do anything else right now
  }

  setTimeout(function() {
    onNetflixLoad();
  }, TIME_BEFORE_RUN);

  setTimeout(function() {
    const player = getPlayer();
    player.pause();
    player.seek(1091243) //seek to roughly 18mins
    // player.play();
  }, TIME_BEFORE_RUN * 3);

}


// Required so we can access the Netflix player and other page elements
function embedInPage(fn) {
  const script = document.createElement("script");
  script.text = `(${fn.toString()})();`;
  document.documentElement.appendChild(script);
}


// Define these ones here as well since we need to use these to check whether
// or not we need to embed code in the first place
const SYNC_GMT_TIMESTAMP_PARAM = 'syncGMTTimestamp';
const SYNC_GMT_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_GMT_TIMESTAMP_PARAM + "=([^&#]*)");
const SYNC_VIDEO_TIMESTAMP_PARAM = 'syncVideoTimestamp';
const SYNC_VIDEO_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_VIDEO_TIMESTAMP_PARAM + "=([^&#]*)");

const url = window.location.href;

// Only embed the code in the page if both parameters exist
// Ex: https://www.netflix.com/watch/70079583?syncGMTTimestamp=1584939579?syncVideoTimestamp=1091243
if (SYNC_GMT_TIMESTAMP_REGEX.test(url) && SYNC_VIDEO_TIMESTAMP_REGEX.test(url)) {
  embedInPage(embeddedCode);
}
