import { Buffer } from 'buffer'; // استيراد Buffer بشكل صريح لحل مشكلة الخطأ

export async function handler(event, context) {
  try {
    // التحقق من نوع الطلب
    if (event.httpMethod !== "POST") {
      return { 
        statusCode: 405, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method Not Allowed" }) 
      };
    }

    const { message, type } = JSON.parse(event.body);

    // الرابط الخاص بك
    const KILWA_CHAT_URL = "http://de3.bot-hosting.net:21007/kilwa-chat";

    if (type === "chat") {
      // الاتصال بسيرفر البوت الخاص بك
      const response = await fetch(`${KILWA_CHAT_URL}?text=${encodeURIComponent(message)}`);
      
      if (!response.ok) {
        throw new Error(`سيرفر البوت أعطى استجابة خاطئة: ${response.status}`);
      }

      const rawText = await response.text();
      let cleanResponseText = rawText;

      // محاولة استخراج النص إذا كان الرد بتنسيق JSON
      try {
        const jsonData = JSON.parse(rawText);
        cleanResponseText = jsonData.response || jsonData.text || jsonData.message || rawText;
      } catch (e) {
        // الرد نصي مباشر (مثل "أهلاً") - لا نحتاج لتغيير
      }

      // إرسال الرد بتنسيق متوافق مع واجهة موقعك (candidates structure)
      return {
        statusCode: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: cleanResponseText }]
            }
          }]
        }),
      };

    } else if (type === "image") {
      // منطق توليد الصور
      const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(message)}`);
      const transData = await transRes.json();
      const enPrompt = transData[0][0][0];

      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(enPrompt)}?width=1024&height=1024&seed=${Math.random()}`;
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: imageUrl }),
      };
    }

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
