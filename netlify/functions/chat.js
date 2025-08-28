export async function handler(event, context) {
  try {
    const { message, type } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;

    let apiUrl = "";
    let payload = {};

    if (type === "chat") {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ role: "user", parts: [{ text: message }] }]
      };
    } else if (type === "image") {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      payload = {
        instances: [{ prompt: message }],
        parameters: { sampleCount: 1 }
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (type === "image") {
      const base64 = result?.predictions?.[0]?.bytesBase64Encoded || null;
      const uri = result?.predictions?.[0]?.uri || null;
      return {
        statusCode: 200,
        body: JSON.stringify({ image: base64, uri }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
