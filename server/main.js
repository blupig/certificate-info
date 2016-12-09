
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

// Handles only /url
function handle_request(request, response){
  // Check arguments
  if (request.url.length < 7 || request.url.substring(0, 6) != '/?url=') {
    response.statusCode = 400;
    response.end('');
    return;
  }

  // Get hostname
  var target_url = querystring.parse(request.url.substring(2))['url'];
  var hostname = url.parse(target_url).hostname;

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
    cert_info = res.connection.getPeerCertificate();

    // Construct response
    response_obj = {};
    response_obj['all'] = cert_info;

    if (typeof cert_info['subject']['O'] !== 'undefined') {
      response_obj['validation_level'] = 'IV';
    } else {
      response_obj['validation_level'] = 'DV';
    }

    response_text = JSON.stringify(response_obj);
    response_cache[hostname] = response_text;
    finishResponse(response, response_text);
  });

  req.on('socket', function(socket) {
      socket.on('timeout', function() {
          req.abort();
          finishResponse(response, '');
      });
  });

  req.on('aborted', function() {
    finishResponse(response, '');
  });

  req.on('error', function() {
    finishResponse(response, '');
  });

  req.end();
}
