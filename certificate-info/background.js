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
var colors = {'': '#888', 'gray': '#888', 'red': '#FF1744', 'orange': '#EF6C00', 'yellow': '#FF9800', 'blue': '#2196F3'}

// In-memory data store
var tabDataAvailable = {};
var tabProtocol = {};
var tabData = {};
var currentTabId = 0;

// Update all tabs on start
updateAllTabs();

// Perform update on all tabs
function updateAllTabs() {
  chrome.tabs.query({}, function(tab) {
    for (var i = 0; i < tab.length; i++) {
      updateTab(tab[i], false);
    }
  });

  // Update currentTabId
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTabId = tabs[0].id;
  });
}

// Update on windows focus change
chrome.windows.onFocusChanged.addListener(function(windowId) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTabId = tabs[0].id;
    updateTab(tabs[0]);
  });
});

// Update on tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTabId = tabs[0].id;
    updateTab(tabs[0]);
  });
});

// Update on content change
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  updateTab(tab);
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
function updateTab(tab) {
  // Validate and get tab info
  if (typeof tab === 'undefined') return;
  var url = tab.url;
  var tabId = tab.id;
  if (typeof url === 'undefined' || typeof tabId === 'undefined') return;

  // Find out page protocol
  var proto = pageProtocol(url);
  tabProtocol[tabId] = proto;

  if (proto === 'https') {
    // Extract hostname
    var hostname = url.substr(8, url.length - 1 - 8);
    for (var i = 8, len = url.length; i < len; i++) {
      if (url[i] === '/') {
        hostname = url.substr(8, i - 8);
        break;
      }
    }

    // Display data if already fetched
    if (tabId in tabData) {
      displayPageInfo(tabId, proto, tabData[tabId])
      return;
    }

    // Fetch
    tabDataAvailable[tabId] = false;
    updateBadge(tabId, 'gray', '...');
    fetchCertInfo(hostname, function(data) {
      // Store response
      tabData[tabId] = data;
      tabDataAvailable[tabId] = true;
      displayPageInfo(tabId, proto, data);
    })
    return;
  }

  // All other protocols (no validation data)
  tabDataAvailable[tabId] = true;
  displayPageInfo(tabId, proto, null);
}

// Display page info
function displayPageInfo(tabId, pageProtocol, validationData) {
  if (pageProtocol === 'http') {
    // Show warning for HTTP
    updateBadge(tabId, 'orange', 'i');
  } else if (pageProtocol === 'https') {
    // HTTPS
    // If failed to fetch data
    if (validationData === null) {
      updateBadge(tabId, 'red', '!');
      return;
    }

    // Display data
    updateBadge(tabId, validationData['result_color'], validationData['validation_result_short']);
  } else {
    // Clear badge
    updateBadge(tabId, '', '');
  }
}

// Update badge
function updateBadge(tabId, color, text) {
  // Don't update if no tabId provided
  if (typeof tabId === 'undefined') {
    return;
  }

  chrome.browserAction.setBadgeBackgroundColor({color: colors[color], tabId: tabId});
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

    // Parse
    try {
      var validationData = JSON.parse(this.responseText);
      callback(validationData);
    } catch(e) {
      callback(null);
    }
  };

  // Make request
  xhr.open('GET', 'https://api.blupig.net/certificate-info/cert?host=' + encodeURIComponent(hostname), true);
  xhr.send();
}
