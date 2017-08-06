//
//    certificate-info
//    Copyright (C) 2017 Yunzhu Li
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

// Colors
var badgeColors = {'...': '#757575', 'i': '#EF6C00', '!': '#FF1744', 'DV': '#FF9800', 'IV': '#2196F3'}

// Cache data
var cachedData = {};

// Data of active tab, for popup
var currentPageProtocol = '';
var currentCertInfo = null;

// Update all tabs on start
updateAllTabs();

// Perform update on all tabs
function updateAllTabs() {
  chrome.tabs.query({}, function(tab) {
    for (var i = 0; i < tab.length; i++) {
      updateTab(tab[i], false);
    }
  });
}

// Update on windows focus change
chrome.windows.onFocusChanged.addListener(function(windowId) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    updateTab(tabs[0], true);
  });
});

// Update on tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    updateTab(tabs[0], true);
  });
});

// Update on content change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0].id == tabId) {
      updateTab(tab, true);
    } else {
      updateTab(tab, false);
    }
  });
});

// Get connection protocol
function pageProtocol(url) {
  if (url.substring(0, 7) === 'http://') {
    return 'http';
  } else if (url.substring(0, 8) === 'https://') {
    return 'https';
  } else {
    return '';
  }
}

// Fetch and display cert info for a tab
function updateTab(tab, isActiveTab) {
  // Validate and get tab info
  if (typeof tab === 'undefined') return;
  var url = tab.url;
  var tabId = tab.id;
  if (typeof url === 'undefined' || typeof tabId === 'undefined') return;

  // Find out page protocol
  var proto = pageProtocol(url);
  if (isActiveTab) currentPageProtocol = proto;

  if (proto === 'https') {
    // Extract hostname
    var hostname = url.substr(8, url.length - 1 - 8);
    for (var i = 8, len = url.length; i < len; i++) {
      if (url[i] === '/') {
        hostname = url.substr(8, i - 8);
        break;
      }
    }

    // Display data if already cached
    if (hostname in cachedData) {
      if (isActiveTab) currentCertInfo = cachedData[hostname];
      displayPageInfo(proto, cachedData[hostname], tabId)
      return;
    }

    // Fetch if not cached
    // Temporarily disable popup
    chrome.browserAction.setPopup({popup: ''});
    updateBadge('...', tabId);
    fetchCertInfo(hostname, function(data) {
      // Enable popup
      chrome.browserAction.setPopup({popup: 'popup.html'});

      if (isActiveTab) currentCertInfo = data;
      displayPageInfo(proto, data, tabId);
    })
    return;
  }

  // All other protocols
  displayPageInfo(proto, null, tabId);
}

// Display page info
function displayPageInfo(pageProtocol, certData, tabId) {
  if (pageProtocol === 'http') {
    // Show warning for HTTP
    updateBadge('i', tabId);
  } else if (pageProtocol === 'https') {
    // HTTPS
    // If failed to fetch data
    if (certData === null) {
      updateBadge('!', tabId);
      return;
    }

    // If certificate not validated
    if (!('validation_level' in certData)) {
      updateBadge('!', tabId);
      return;
    }

    // Validated cert, display level
    updateBadge(certData['validation_level_short'], tabId);
  } else {
    // Clear badge
    updateBadge('', tabId);
  }
}

// Update badge
function updateBadge(text, tabId) {
  // Don't update if no tabId provided
  if (typeof tabId === 'undefined') {
    return;
  }

  // Clear badge
  if (text == null) {
    chrome.browserAction.setBadgeText({text: '', tabId: tabId});
    return;
  }

  // Default: gray
  var color = '#757575'
  if (text in badgeColors) {
    color = badgeColors[text]
  }

  chrome.browserAction.setBadgeBackgroundColor({color: color, tabId: tabId});
  chrome.browserAction.setBadgeText({text: text, tabId: tabId});
}

// Fetch cert info through API
// Only hostname is sent
function fetchCertInfo(hostname, callback) {
  // Create XHR
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    // Only handle event when request is finished
    if (xhr.readyState !== 4) {
      return;
    }

    if (typeof this.responseText === 'undefined' || this.responseText.length === 0) {
      callback(null);
      return;
    }

    // Parse and cache response
    try {
      var cert_info = JSON.parse(this.responseText);
      cachedData[hostname] = cert_info;
      // Pass data back
      callback(cert_info);
    } catch(e) {
      callback(null);
    }
  };

  // Make request
  xhr.open('GET', 'https://api.blupig.net/certificate-info/cert?host=' + encodeURIComponent(hostname), true);
  xhr.send();
}
