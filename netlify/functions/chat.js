export async function handler(event, context) {
  try {
    // التأكد من أن الطلب POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { message, type } = JSON.parse(event.body);

    // 1. رابط البوت الخاص بك (للدردشة النصية)
    const KILWA_CHAT_URL = "http://de3.bot-hosting.net:21007/kilwa-chat";
    
    // 2. محرك توليد الصور (لطلبات الصور)
    const IMAGE_GEN_URL = "https://pollinations.ai/p/";

    if (type === "chat") {
      // الاتصال برابط البوت الخاص بك
      const response = await fetch(`${KILWA_CHAT_URL}?text=${encodeURIComponent(message)}`);
      
      if (!response.ok) {
        throw new Error(`خطأ من سيرفر البوت: ${response.status}`);
      }

      // قراءة الرد (سواء كان نصاً مباشراً أو JSON)
      const rawData = await response.text();
      let finalMessage = rawData;

      try {
        const jsonData = JSON.parse(rawData);
        finalMessage = jsonData.response || jsonData.text || jsonData.message || rawData;
      } catch (e) {
        // الرد نصي عادي، نتركه كما هو
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          candidates: [{ content: { parts: [{ text: finalMessage }] } }] 
        }),
      };

    } else if (type === "image") {
      // منطق توليد الصور (ترجمة النص ثم الرسم)
      const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(message)}`;
      const transRes = await fetch(transUrl);
      const transData = await transRes.json();
      const enText = transData[0][0][0];

      const imageUrl = `${IMAGE_GEN_URL}${encodeURIComponent(enText)}?width=1024&height=1024&seed=${Math.random()}`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ uri: imageUrl }),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "نوع الطلب غير مدعوم" }) };

  } catch (error) {
    console.error("Internal Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
