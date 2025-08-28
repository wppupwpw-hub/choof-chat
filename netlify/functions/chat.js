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
      // تم التغيير لاستخدام gemini-2.5-flash-image-preview لتوليد الصور
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
      payload = {
        contents: [{
          parts: [{ text: message }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'] // طلب استجابة تتضمن نص وصورة
        },
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
      // في حالة gemini-2.5-flash-image-preview، نبحث عن الصورة في candidates[0].content.parts
      const base64 = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (!base64) {
        console.error("Image generation API did not return base64 data:", result);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "لم يتم استلام بيانات صورة صالحة من API." }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ image: base64, uri: null }), // لا يوجد URI مباشر هنا
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
