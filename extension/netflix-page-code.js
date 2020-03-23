function embeddedCode() {
  const syncStates = {
    UNINITIALIZED: 'uninitialized',
    WAITING_FOR_START: 'waiting_for_start',
    STARTED: 'started'
  }

  const TIME_BEFORE_RUN = 1000; // Give Netflix this much time to load
  // TODO: Do this reactively rather than guessing

  function getPlayer() {
    try {
      const videoPlayer = netflix
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer

      // Getting player id
      const playerSessionId = videoPlayer
        .getAllPlayerSessionIds()[0]

      const player = videoPlayer
        .getVideoPlayerBySessionId(playerSessionId)

      return player
    } catch(err) {
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
    console.log(player)
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

embedInPage(embeddedCode);
