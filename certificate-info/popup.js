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

document.addEventListener('DOMContentLoaded', function () {
  var background = chrome.extension.getBackgroundPage();
  var backgroundColors = background.badgeColors;
  var pageProtocol = background.currentPageProtocol;
  var certInfo = background.currentCertInfo;

  // HTTP page
  if (pageProtocol === 'http') {
    updateTitle(backgroundColors['i'], 'HTTP Page')
    updateOrganization('');
    updateMessage('Data sent to / received from this site is transmitted in plaintext.');
    return;
  }

  // HTTPS page
  if (pageProtocol === 'https') {
    if (certInfo == null) {
      // Data failed to fetch if HTTPS page and no data available
      updateTitle(backgroundColors['!'], 'Data fetch error')
    } else {
      // Check if certificate is validated
      if (!('validation_level' in certInfo)) {
        updateTitle(backgroundColors['!'], 'Validation Failed');
        updateOrganization('');
        updateMessage(certInfo['message']);
        return;
      }

      // Cert valid, display info
      updateTitle(backgroundColors[certInfo['validation_level_short']], certInfo['validation_level']);
      updateOrganization(certInfo['organization']);
      updateMessage(certInfo['message']);
    }
  } else {
    // Other pages
    updateTitle('#757575', 'No HTTP(S) page loaded');
    updateOrganization('');
    updateMessage('Certificate information will display here when you open an HTTPS page.');
  }
});

function updateTitle(color, text) {
  document.getElementById('lblTitle').innerHTML = text;
  document.getElementById('lblTitle').style['background'] = color;
}

function updateOrganization(text) {
  document.getElementById('lblOrganization').innerHTML = '<b>' + text + '</b>';
}

function updateMessage(text) {
  document.getElementById('lblMessage').innerHTML = text;
}
