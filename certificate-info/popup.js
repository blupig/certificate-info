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
  var currentTabId = background.currentTabId;
  var popupData = background.popupData[currentTabId];

  document.getElementById('lblValidationResult').style['background'] = popupData['color'];
  document.getElementById('lblValidationResult').innerHTML = popupData['validation_result'];
  document.getElementById('lblCertOrganization').innerHTML = '<b>' + popupData['cert_organization'] + '</b>';
  document.getElementById('lblMessage').innerHTML = popupData['message'];
});
