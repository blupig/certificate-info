## Certificate Info
A Chrome extension that shows website's certificate validation level on the toolbar and more information in popup window.

[Open in Chrome Web Store](https://chrome.google.com/webstore/detail/certificate-info/jhldepncoippkjgjkmambfglddmjdmaj)

Certificates have different level of validation performed by the CA (Domain Control, Identity, Extended Validation, etc. More info [here](https://www.globalsign.com/en/ssl-information-center/types-of-ssl-certificate/)), however this information is usually not very convenient to find in the browser (except for EV certificates). This plugin displays the validation type on the toolbar, and more information in popup.

Due to the limitation of Chrome's extension API, the validation info needs to be fetched from the [server](server), which only receives the hostname. In TLS, hostnames are already submitted in plaintext because of SNI.

![Screenshot](docs/images/screenshot.png)
