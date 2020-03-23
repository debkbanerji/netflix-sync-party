function embeddedCode() {
  // Have to define constants in this function since it needs to be serialized
  // to be embedded

  const TIME_BEFORE_RUN = 1000; // Give Netflix this much time to load
  // TODO: Do this reactively rather than guessing

  const SYNC_GMT_TIMESTAMP_PARAM = 'syncGMTTimestamp';
  const SYNC_GMT_NUM_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_GMT_TIMESTAMP_PARAM + "=\\d*");

  const SYNC_VIDEO_TIMESTAMP_PARAM = 'syncVideoTimestamp';
  const SYNC_VIDEO_NUM_TIMESTAMP_REGEX = new RegExp("[\\?&]" + SYNC_VIDEO_TIMESTAMP_PARAM + "=\\d*");

  const GMT_URL = 'https://worldtimeapi.org/api/timezone/Europe/London';

  const MS_IN_SEC = 1000;

  function getPlayer() {
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

    const url = window.location.href;
    const syncGMTTs = parseInt(SYNC_GMT_NUM_TIMESTAMP_REGEX.exec(url)[0].split('=')[1]);
    // default to assuming the video should start at 0
    let syncVideoTargetTs = 0;
    try {
      // try to read time from url
      syncVideoTargetTs = parseInt(SYNC_VIDEO_NUM_TIMESTAMP_REGEX.exec(url)[0].split('=')[1]);
    } catch (err) {
      // ignore error - just use 0 as the default
    }

    const player = getPlayer();

    // Get the current time from the web to avoid issues with computers that
    // have incorrectly set time
    fetch(GMT_URL)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const currentGMTTs = data.unixtime;

        // time between now and when the video should start
        const timeToVideoStartSec = syncGMTTs - currentGMTTs + syncVideoTargetTs;
        const timeToVideoStartMs = timeToVideoStartSec * MS_IN_SEC;

        if (timeToVideoStartMs > 0) {
          // video should not start yet - schedule the start
          setTimeout(function() {
            player.play();
          }, timeToVideoStartMs);
        } else if (false) {
          // video is over
          // TODO: Build UI to deal with this
        } else {
          // video should have started already - seek to the appropriate point
          player.seek(-1 * timeToVideoStartMs);
          player.play();
        }

      });
  }

  setTimeout(function() {
    onNetflixLoad();
  }, TIME_BEFORE_RUN);

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

const url = window.location.href;

// Only embed the code in the page if at least the GMT timestamp exists
// Ex 1: https://www.netflix.com/watch/70079583?syncGMTTimestamp=1584939579?syncVideoTimestamp=1091243
// Ex 2: https://www.netflix.com/watch/70079583?syncGMTTimestamp=1584939579
if (SYNC_GMT_TIMESTAMP_REGEX.test(url)) {
  embedInPage(embeddedCode);
}
