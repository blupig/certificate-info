// MIT License
//
// Copyright (c) 2016 Yunzhu Li
// https://github.com/yunzhu-li/chrome-cert-info
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const url = require('url');

// Cache fetched certificates
var response_cache = {};

// Create and start HTTP server
var server = http.createServer(handle_request);
server.listen(8000, '0.0.0.0', function(){
  console.log("Started listening...");
});

// Handles only /chrome-cert-info/
function handle_request(request, response){
  // Allow request from extension
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Check arguments
  if (request.url.length < 29 || request.url.substring(0, 28) !== '/chrome-cert-info/?hostname=') {
    response.statusCode = 400;
    response.end('');
    return;
  }

  // Get hostname
  var hostname = querystring.parse(request.url.substring(19))['hostname'];

  // Respond directly if found in cache
  if (typeof response_cache[hostname] !== 'undefined') {
    finishResponse(response, response_cache[hostname]);
  } else {
    respond_with_cert_info(hostname, response);
  }
}

// Sends response
function finishResponse(response, content) {
  response.end(content);
}

// Fetch cert info
function respond_with_cert_info(hostname, response) {
  var options = {
    host: hostname,
    port: 443,
    method: 'GET',
    timeout: 1000
  };

  var req = https.request(options, function(res) {
    // Get certificate information
    cert_info = res.connection.getPeerCertificate();
    if (typeof cert_info === 'undefined' || !('subject' in cert_info)) {
      finishResponse(response, '');
      return;
    }

    // Construct response
    response_obj = {};
    response_obj['all'] = cert_info;

    // If "organization" field exists
    if (typeof cert_info['subject']['O'] !== 'undefined') {
      response_obj['validation_level'] = 'IV';
    } else {
      response_obj['validation_level'] = 'DV';
    }

    // Serialize
    response_text = JSON.stringify(response_obj);

    // Cache result
    response_cache[hostname] = response_text;

    // Send back response
    finishResponse(response, response_text);
  });

  // Handle timeout
  req.on('socket', function(socket) {
      socket.on('timeout', function() {
          req.abort();
          finishResponse(response, '');
      });
  });

  // Handle exceptions
  req.on('aborted', function() {
    finishResponse(response, '');
  });

  req.on('error', function() {
    finishResponse(response, '');
  });

  // Do not keep connection
  req.shouldKeepAlive = false

  // Send request
  req.end();
}
