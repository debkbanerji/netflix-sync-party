const netflixWatchURLRegex = /^http(s|):\/\/.*\.netflix\.com\/watch\/.*$/i

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    chrome.tabs.get(tabId, function(tab) {
      const url = tab.url;
      // Check to see if the Netflix tab is the one that was selected
      if (netflixWatchURLRegex.test(url)) {

        // Run our code on the page so it has access to the player
        fetch("netflix-page-code.js").then(function(codeResponse) {
          codeResponse.text().then(function(code) {
            chrome.tabs.executeScript(tab.id, {
              code: code
            }, function(executionResponse) {
              // don't need to do anything with the response
            });
          })
        });
      }
    });
  }
})
