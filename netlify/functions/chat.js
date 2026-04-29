export async function handler(event, context) {
  // الرابط الخاص بك
  const KILWA_CHAT_URL = "http://de3.bot-hosting.net:21007/kilwa-chat";

  try {
    // 1. التأكد من أن الطلب POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. قراءة الرسالة المرسلة من الموقع
    const body = JSON.parse(event.body);
    const userMessage = body.message;
    const requestType = body.type;

    // 3. معالجة طلبات الدردشة النصية
    if (requestType === "chat") {
      // الاتصال بسيرفر البوت الخاص بك
      const response = await fetch(`${KILWA_CHAT_URL}?text=${encodeURIComponent(userMessage)}`);
      
      if (!response.ok) {
        throw new Error("سيرفر البوت لا يستجيب حالياً");
      }

      // الحصول على الرد (سواء كان نصاً عادياً أو JSON)
      const rawData = await response.text();
      let finalText = rawData;

      try {
        // إذا كان الرد بتنسيق JSON، نستخرج النص منه
        const jsonData = JSON.parse(rawData);
        finalText = jsonData.response || jsonData.text || jsonData.message || rawResponse;
      } catch (e) {
        // إذا فشل الـ JSON، يعني أن الرد نصي مباشر وهو المطلوب
      }

      // 4. إرسال الرد بتنسيق "نظيف" يفهمه ملف الـ HTML لديك
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: finalText }]
            }
          }]
        })
      };
    } 
    
    // 5. معالجة طلبات الصور (اختياري)
    else if (requestType === "image") {
      // نستخدم محرك رسم بسيط ومباشر
      const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(userMessage)}?width=1024&height=1024&seed=${Math.random()}`;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: imgUrl })
      };
    }

  } catch (error) {
    // في حال حدوث أي خطأ، نرسل رسالة واضحة للمستخدم
    return {
      statusCode: 200, // نرسل 200 لتجنب ظهور أخطاء في الكونسول وعرض الخطأ في الشات
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: "عذراً، واجهت مشكلة في الاتصال بالسيرفر. تأكد من أن رابط البوت يعمل." }]
          }
        }]
      })
    };
  }
}
