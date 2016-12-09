//
// Cache results
var cached_levels = {};

// Update on activation
chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    badgeValidationLevel(tab[0].url);
  });
});

// Update on content change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true}, function(tab) {
    badgeValidationLevel(tab[0].url);
  });
});

// Update badge text to validation level
function badgeValidationLevel(url) {
  // Set badge if already cached
  if (typeof cached_levels['url'] !== 'undefined') {
    chrome.browserAction.setBadgeText({text: cached_levels[url][100]});
    return;
  }

  // Make request
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var cert_info = JSON.parse(this.responseText);
        var lvl = cert_info['validation_level'];
        cached_levels['url'] = lvl;
        chrome.browserAction.setBadgeText({text: lvl[100]});
      }
  };

  xhr.open("GET", "https://api.blupig.net/cert-info/?url=" + encodeURIComponent(url), true);
  xhr.send();
}
