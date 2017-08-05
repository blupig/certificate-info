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
  var page = chrome.extension.getBackgroundPage();
  var certInfo = page.currentCertInfo;
  var backgroundColors = page.badgeColors;

  if (certInfo == null) {
    if (page.currentPageHTTPS) {
      // Data failed to fetch if HTTPS page and no data available
      updateTitle(backgroundColors['ERR'], 'Data fetch error')
    } else {
      // Also no data if not HTTPS page
      updateTitle('#757575', 'No HTTPS page loaded');
      updateOrganization('');
      updateMessage('Certificate information will display here when you open an HTTPS page.');
    }
    return;
  }

  // Check if certificate is validated
  if (!('validation_level' in certInfo)) {
    updateTitle(backgroundColors['ERR'], 'Not Validated');
    updateOrganization('');
    updateMessage(certInfo['message']);
    return;
  }

  // Display info
  updateTitle(backgroundColors[certInfo['validation_level_short']], certInfo['validation_level']);
  updateOrganization(certInfo['organization']);
  updateMessage(certInfo['message']);
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
