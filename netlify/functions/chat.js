export async function handler(event, context) {
  try {
    const { message, type } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY غير متاح في متغيرات البيئة." }),
      };
    }

    let apiUrl = "";
    let payload = {};

    if (type === "chat") {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ role: "user", parts: [{ text: message }] }]
      };
    } else if (type === "image") {
      // Using imagen-3.0-generate-002 as specified
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      payload = {
        instances: [{ prompt: message }],
        parameters: { sampleCount: 1 } // Requesting one image
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "نوع طلب غير صالح." }),
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Check if the API call itself was successful (e.g., status 200)
    if (!response.ok) {
      const errorText = await response.text(); // Get the raw error text for debugging
      console.error(`API Error Response (${response.status}):`, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `خطأ من API Gemini: ${errorText}` }),
      };
    }

    const result = await response.json();

    if (type === "image") {
      const base64 = result?.predictions?.[0]?.bytesBase64Encoded || null;
      const uri = result?.predictions?.[0]?.uri || null;

      if (!base64 && !uri) {
        console.error("Image generation API did not return base64 or URI:", result);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "لم يتم استلام بيانات صورة صالحة من API." }),
        };
      }

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
    console.error("Function execution error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `خطأ داخلي في الخادم: ${error.message}` }),
    };
  }
}
