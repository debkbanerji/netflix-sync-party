function embeddedCode() {
    // Have to define constants in this function since it needs to be serialized
    // to be embedded

    const MS_IN_SEC = 1000;

    const TIME_BEFORE_RUN = 1.0 * MS_IN_SEC; // Give Netflix this much time to load

    const SYNC_GMT_TIMESTAMP_PARAM = "syncGMTTimestampSec";
    const SYNC_GMT_NUM_TIMESTAMP_REGEX = new RegExp(
        "[\\?&]" + SYNC_GMT_TIMESTAMP_PARAM + "=\\d*"
    );

    const SYNC_VIDEO_TIMESTAMP_PARAM = "syncVideoTimestampSec";
    const SYNC_VIDEO_NUM_TIMESTAMP_REGEX = new RegExp(
        "[\\?&]" + SYNC_VIDEO_TIMESTAMP_PARAM + "=\\d*"
    );

    const USE_NETWORK_TIME = false; // TODO: FIX WITHIN PAGE
    const GMT_URL = "https://worldtimeapi.org/api/timezone/Europe/London";

    // how far ahead actual time is relative to system time
    let currentTimeToActualGMTOffset = 0;

    // netflix player session Id
    let playerSessionId;

    /* Countdown timer HTML IDs (these elements are dynamically modified)*/
    const COUNTDOWN_TIMER_DIV_ID = "countdown-timer-div"; //removed after party starts
    const COUNTDOWN_TIMER_H2_ID = "countdown-timer-h2"; //updated every second till party starts

    let timerInserted = false;
    
    const NETFLIX_MOUNT_CLASS = "sizing-wrapper"; //netflix HTML element class where counter will be inserted

    // try to update currentTimeToActualGMTOffset
    fetch(GMT_URL)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.unixtime) {
                currentTimeToActualGMTOffset =
                    data.unixtime - Date.now() / MS_IN_SEC;
            }
        });

    function getVideoPlayer() {
        return netflix.appContext.state.playerApp.getAPI().videoPlayer;
    }

    function getPlayer() {
        try {
            const videoPlayer = getVideoPlayer();

            // Getting player id
            playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];

            const player = videoPlayer.getVideoPlayerBySessionId(
                playerSessionId
            );

            return player;
        } catch (err) {
            alert("Netflix link sync unable to access player on page");
            console.error(err);
        }
    }

    const onSyncFunction = (player, syncGMTTs, syncVideoTargetTs) => {
        // only sync if video is playing
        if (
            !playerSessionId ||
            getVideoPlayer().isVideoPlayingForSessionId(playerSessionId)
        ) {
            const MAX_DESYNC_DELTA = 3 * MS_IN_SEC;

            // recalculate these
            const currentGMTTs =
                Date.now() / MS_IN_SEC + currentTimeToActualGMTOffset;
            // time between now and when the video should start
            const timeToVideoStartSec =
                syncGMTTs - currentGMTTs - syncVideoTargetTs;
            const timeToVideoStartMs = timeToVideoStartSec * MS_IN_SEC;
            const targetPlayerTime = -1 * timeToVideoStartMs;

            const currentPlayerTime = player.getCurrentTime();
            const delta = Math.abs(targetPlayerTime - currentPlayerTime);
            if (delta && delta > MAX_DESYNC_DELTA) {
                // resync
                player.seek(targetPlayerTime);
                player.play();
                // alert the viewer if the video has already ended
                if (player.isEnded()) {
                    alert("The scheduled video has ended");
                }
            }
        }
    };

    /*
    Utility method to convert JSON holding CSS attributes to string
  */
    function createStyleString(cssObj) {
        return JSON.stringify(cssObj)
            .split(",")
            .join(";")
            .split('"')
            .join("")
            .slice(1, -1);
    }

    function createCountdownTimer() {
        // styling for the countdown timer div
        let divCss = {
            position: "absolute",
            "margin-top": "40px",
            left: "50%",
            transform: "translateX(-50%) scale(2)",
            color: "white",
            "z-index": "9999999",
            "background-color": "black",
            "border-radius": "10px",
            border: "red",
            "border-style": "solid",
            "text-align": "center",
            "padding-left": ".83em",
            "padding-right": ".83em",
            visibility: "hidden"
        };
        let div = document.createElement("div"); // enclosing countdown timer div
        let h2 = document.createElement("h2"); // remaining time text
        let h3 = document.createElement("h4"); // message
        h2.innerText = "00:00";
        h2.id = COUNTDOWN_TIMER_H2_ID;
        h3.innerText = "till your Netflix Sync Party starts";
        div.appendChild(h2);
        div.appendChild(h3);
        div.id = COUNTDOWN_TIMER_DIV_ID;
        div.style = createStyleString(divCss);
        try {
            document
                .getElementsByClassName(NETFLIX_MOUNT_CLASS)
                .item(0)
                .appendChild(div);
            timerInserted = true;
        } catch (err) {
            console.error("Unable to add countdown timer to DOM. NETFLIX_MOUNT_CLASS:" + NETFLIX_MOUNT_CLASS);
            console.error(err);
        }
    }

    function onNetflixLoad() {
        const url = window.location.href;
        const syncGMTTs = parseInt(
            SYNC_GMT_NUM_TIMESTAMP_REGEX.exec(url)[0].split("=")[1]
        );
        // default to assuming the video should start at 0
        let syncVideoTargetTs = 0;
        try {
            // try to read time from url
            syncVideoTargetTs = parseInt(
                SYNC_VIDEO_NUM_TIMESTAMP_REGEX.exec(url)[0].split("=")[1]
            );
        } catch (err) {
            // ignore error - just use 0 as the default
        }

        const player = getPlayer();

        const currentGMTTs = Date.now() / MS_IN_SEC;
        // time between now and when the video should start
        const timeToVideoStartSec =
            syncGMTTs - currentGMTTs - syncVideoTargetTs;
        const timeToVideoStartMs = timeToVideoStartSec * MS_IN_SEC;

        const TIME_TO_SCHEDULE = 3 * MS_IN_SEC;
        const SYNC_INTERVAL_MS = 3 * MS_IN_SEC;

        if (timeToVideoStartMs > 0) {
            // video should not start yet - reset and schedule the start
            setTimeout(function() {
                const player = getPlayer();
                player.seek(0);
                player.pause();
                createCountdownTimer(); //add countdown timer to DOM
                if (timerInserted) {
                    //start countdown
                    let remainingTime = timeToVideoStartMs - TIME_TO_SCHEDULE;
                    var updateTimer = setInterval(() => {
                        if (
                            document.getElementById(COUNTDOWN_TIMER_DIV_ID).style
                                .visibility === "hidden"
                        ) {
                            document.getElementById(
                                COUNTDOWN_TIMER_DIV_ID
                            ).style.visibility = "visible";
                        }
                        //update timer
                        remainingTime -= MS_IN_SEC;
                        let min = Math.floor(remainingTime / (1000 * 60));
                        let sec = Math.floor(remainingTime / 1000) % 60;
                        min = min < 10 ? "0" + min : min;
                        sec = sec < 10 ? "0" + sec : sec;
                        let countdownStr = min.toString() + ":" + sec.toString();
                        document.getElementById(
                            COUNTDOWN_TIMER_H2_ID
                        ).innerText = countdownStr;
                    }, 1000);
                }
                setTimeout(function() {
                    if (timerInserted) {
                        //remove timer, end countdown
                        document.getElementById(COUNTDOWN_TIMER_DIV_ID).remove(); //remove timer
                        timerInserted = false;
                        if (typeof updateTimer !== "undefined") {
                            clearInterval(updateTimer);
                        }
                    }
                    player.play();
                    setInterval(
                        onSyncFunction,
                        SYNC_INTERVAL_MS,
                        player,
                        syncGMTTs,
                        syncVideoTargetTs
                    );
                }, timeToVideoStartMs - TIME_TO_SCHEDULE);
            }, TIME_TO_SCHEDULE);
        } else {
            setInterval(
                onSyncFunction,
                SYNC_INTERVAL_MS,
                player,
                syncGMTTs,
                syncVideoTargetTs
            );
        }
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
const SYNC_GMT_TIMESTAMP_PARAM = "syncGMTTimestampSec";
const SYNC_GMT_TIMESTAMP_REGEX = new RegExp(
    "[\\?&]" + SYNC_GMT_TIMESTAMP_PARAM + "=([^&#]*)"
);

const url = window.location.href;

// Only embed the code in the page if at least the GMT timestamp exists
// Ex 1: https://www.netflix.com/watch/70079583?syncGMTTimestampSec=1584939579&syncVideoTimestampSec=1200
// Ex 2: https://www.netflix.com/watch/70079583?syncGMTTimestampSec=1584939579
if (SYNC_GMT_TIMESTAMP_REGEX.test(url)) {
    embedInPage(embeddedCode);
}
