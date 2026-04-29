/**
 * هذا الملف يعمل كـ Serverless Function على Netlify
 * وظيفته: الاتصال بالبوت الخاص بك، تنظيف الرد من الرموز البرمجية، وإرساله للموقع
 */

export async function handler(event, context) {
  try {
    // التأكد من أن الطلب POST (المرسل من الموقع)
    if (event.httpMethod !== "POST") {
      return { 
        statusCode: 405, 
        body: JSON.stringify({ error: "طريقة الطلب غير مسموحة" }) 
      };
    }

    // استلام الرسالة ونوعها من واجهة المستخدم
    const { message, type } = JSON.parse(event.body);

    // الرابط المباشر للبوت الخاص بك
    const KILWA_CHAT_URL = "http://de3.bot-hosting.net:21007/kilwa-chat";
    
    if (type === "chat") {
      // الاتصال بسيرفر البوت وجلب الرد
      const response = await fetch(`${KILWA_CHAT_URL}?text=${encodeURIComponent(message)}`);
      
      if (!response.ok) {
        throw new Error(`سيرفر البوت لا يستجيب: ${response.status}`);
      }

      // قراءة الرد الخام
      const rawResponse = await response.text();
      let finalCleanText = rawResponse;

      // محاولة تنظيف الرد إذا كان يحتوي على هيكل JSON
      try {
        const jsonData = JSON.parse(rawResponse);
        // استخراج النص من الحقول المحتملة
        finalCleanText = jsonData.response || jsonData.text || jsonData.message || rawResponse;
      } catch (e) {
        // الرد نصي مباشر، لا يحتاج لتغيير
      }

      // إرجاع الرد بتنسيق يفهمه ملف index.html الخاص بك
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          candidates: [{ 
            content: { 
              parts: [{ text: finalCleanText }] 
            } 
          }] 
        }),
      };

    } else if (type === "image") {
      // منطق توليد الصور (عبر مترجم جوجل ثم محرك pollinations)
      const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(message)}`;
      const transRes = await fetch(transUrl);
      const transData = await transRes.json();
      const enText = transData[0][0][0];

      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(enText)}?width=1024&height=1024&seed=${Math.random()}`;
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: imageUrl }),
      };
    }

  } catch (error) {
    console.error("Internal Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "حدث خطأ في الخادم: " + error.message }),
    };
  }
}
