// netlify/functions/proxy.js
exports.handler = async (event, context) => {
  // Configuration - change this to your target URL
  const TARGET_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

  try {
    // Extract the path from the original request
    const path = event.path.replace('/.netlify/functions/proxy', '');
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';

    // Construct the full target URL
    const targetUrl = `${TARGET_URL}${path}${queryString}`;

    // Prepare headers (excluding host and other potentially problematic headers)
    const headers = { ...event.headers };
    delete headers.host;
    delete headers['content-length'];

    // Prepare the fetch options
    const fetchOptions = {
      method: event.httpMethod,
      headers: headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
      fetchOptions.body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString()
        : event.body;
    }

    // Make the proxied request
    const response = await fetch(targetUrl, fetchOptions);

    // Get response body
    const responseBody = await response.text();

    // Get response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Add CORS headers if needed
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };

  } catch (error) {
    console.error('Proxy error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }),
    };
  }
};