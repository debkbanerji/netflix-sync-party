const syncStates = {
  UNINITIALIZED: 'uninitialized',
  WAITING_FOR_START: 'waiting_for_start',
  STARTED: 'started'
}

function getNetflixVideoPlayerElement() {
  const videoElements = document.getElementsByTagName("video");

  if (videoElements.length < 1) {
    throw "Video player element not found";
  }
  if (videoElements.length > 1) {
    console.warn("Multiple video players found - guessing that the first one found is the main one")
  }
  return videoElements[0];
}

function onNetflixLoad() {
  let state = syncStates.UNINITIALIZED;

  const videoPlayer = getNetflixVideoPlayerElement();

  while (state !== syncStates.STARTED) {
    state = syncStates.STARTED; // escape
  }
  // the video has started - don't do anything else right now
}


const TIME_BEFORE_RUN = 2000; // Give Netflix this much time to load
// TODO: Do this reactively rather than guessing

setTimeout(function() {
  onNetflixLoad();
}, TIME_BEFORE_RUN);

setTimeout(function() {
  const media = getNetflixVideoPlayerElement();
  media.pause();
}, TIME_BEFORE_RUN * 3);
