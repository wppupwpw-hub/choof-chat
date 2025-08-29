// netlify/functions/chat.js

export async function handler(event, context) {
  try {
    const { message, type } = JSON.parse(event.body);

    // مفتاح Gemini
    const apiKey = process.env.GEMINI_API_KEY;

    // عنوان API لتوليد الصور
    const BOTDEVX_IMAGE_API_URL = 'http://23.95.85.59/ai/image.php';
    const PROXY_SERVERS = [
      "https://api.allorigins.win/raw?url=",
      "https://corsproxy.io/?",
      "https://api.codetabs.com/v1/proxy/?quest="
    ];

    let apiUrl = "";
    let payload = {};
    let isImageGeneration = false;

    // ----- حالة الدردشة -----
    if (type === "chat") {
      if (!apiKey) {
        // رد تجريبي في حال عدم وجود مفتاح
        return {
          statusCode: 200,
          body: JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: "🤖 هذا رد تجريبي بدون مفتاح API." }
                  ]
                }
              }
            ]
          }),
        };
      }

      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ role: "user", parts: [{ text: message }] }]
      };
    } 
    
    // ----- حالة توليد الصور -----
    else if (type === "image") {
      isImageGeneration = true;

      const params = new URLSearchParams();
      params.append('text', message);
      params.append('quality', 'high');
      params.append('size', '512x512');

      const targetApiUrl = `${BOTDEVX_IMAGE_API_URL}?${params.toString()}`;
      const proxyUrl = PROXY_SERVERS[0];
      apiUrl = proxyUrl + encodeURIComponent(targetApiUrl);

      payload = null;
    } 
    
    // ----- نوع غير صالح -----
    else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: "❌ نوع الطلب غير صالح." }
                ]
              }
            }
          ]
        }),
      };
    }

    // إعداد الخيارات
    const fetchOptions = {
      method: payload ? "POST" : "GET",
      headers: {},
    };

    if (payload) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(payload);
    }

    // تنفيذ الطلب
    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: `❌ خطأ من API: ${errorText}` }
                ]
              }
            }
          ]
        }),
      };
    }

    // ----- لو طلب صورة -----
    if (isImageGeneration) {
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      if (!base64) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: "❌ لم يتم استلام بيانات صورة صالحة." }
                  ]
                }
              }
            ]
          }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ image: base64, uri: null }),
      };
    }

    // ----- لو طلب دردشة -----
    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error("Function execution error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: `❌ خطأ داخلي في الخادم: ${error.message}` }
              ]
            }
          }
        ]
      }),
    };
  }
}
