// netlify/functions/gemini-proxy.js

// Using 'node-fetch' to make HTTP requests from the Netlify Function.
// Netlify Functions run in a Node.js environment.
const fetch = require('node-fetch');

/**
 * Main handler for the Netlify Function.
 * This function acts as a secure proxy to the Google Gemini API,
 * protecting the GEMINI_API_KEY by keeping it server-side.
 *
 * @param {object} event - The event object from Netlify, contains request details.
 * @param {object} context - The context object from Netlify.
 * @returns {Promise<object>} - An object with statusCode, headers, and body.
 */
exports.handler = async function(event, context) {
  // Retrieve the GEMINI_API_KEY from Netlify's environment variables.
  // This variable must be set in your Netlify site settings.
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Essential security check: Ensure the API key is actually set.
  if (!GEMINI_API_KEY) {
    console.error('Environment variable GEMINI_API_KEY is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: API key missing.' }),
    };
  }

  // Only allow POST requests to this function.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the incoming request body from the client-side JavaScript.
    const { type, prompt } = JSON.parse(event.body);

    let apiUrl;
    let payload;
    const commonHeaders = { 'Content-Type': 'application/json' };

    // Determine which Gemini API endpoint and payload to use based on the 'type'.
    if (type === 'text') {
      // Configure for text generation using gemini-2.5-flash-preview-05-20
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
      payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };
    } else if (type === 'image') {
      // Configure for image generation using imagen-3.0-generate-002
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`;
      payload = {
        instances: { prompt: prompt },
        parameters: { "sampleCount": 1},
      };
    } else {
      // Handle unsupported request types
      console.warn('Received request with invalid type:', type);
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request type. Must be "text" or "image".' }) };
    }

    // Make the actual call to the Google Gemini API.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    });

    // Parse the response from the Gemini API.
    const data = await response.json();

    // Check if the Gemini API call was successful.
    if (!response.ok) {
      console.error('Error from Gemini API:', response.status, data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Gemini API request failed.' }),
      };
    }

    // Return the successful response from Gemini API to the client-side.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Catch any unexpected errors during the function execution.
    console.error('Netlify Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error during proxy operation.' }),
    };
  }
};
