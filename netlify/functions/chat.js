export async function handler(event, context) {
  try {
    const { message, type } = JSON.parse(event.body);

    // هذا المفتاح لن يُستخدم لطلبات الصور إذا استخدمنا API Botdevx.html
    // ولكنه سيظل مطلوبًا لطلبات الدردشة العادية مع Gemini Chat API.
    const apiKey = process.env.GEMINI_API_KEY;

    // عنوان API لتوليد الصور من Botdevx.html
    const BOTDEVX_IMAGE_API_URL = 'http://23.95.85.59/ai/image.php';
    const PROXY_SERVERS = [
      "https://api.allorigins.win/raw?url=",
      "https://corsproxy.io/?",
      "https://api.codetabs.com/v1/proxy/?quest="
    ];

    let apiUrl = "";
    let payload = {};
    let isImageGeneration = false;

    if (type === "chat") {
      if (!apiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "GEMINI_API_KEY غير متاح لخدمة الدردشة." }),
        };
      }
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ role: "user", parts: [{ text: message }] }]
      };
    } else if (type === "image") {
      isImageGeneration = true;
      
      // بناء رابط API لـ Botdevx.html مع المعلمات
      const params = new URLSearchParams();
      params.append('text', message); // message هنا هو الوصف المترجم
      params.append('quality', 'high'); // يمكن جعل هذا ديناميكيًا إذا أردت
      params.append('size', '512x512'); // يمكن جعل هذا ديناميكيًا إذا أردت
      
      const targetApiUrl = `${BOTDEVX_IMAGE_API_URL}?${params.toString()}`;
      
      // استخدام خوادم البروكسي لتجاوز مشاكل CORS
      // نختار البروكسي الأول، ويمكنك إضافة منطق لتبديل البروكسي إذا فشل الأول
      const proxyUrl = PROXY_SERVERS[0];
      apiUrl = proxyUrl + encodeURIComponent(targetApiUrl);
      
      // لا نحتاج إلى payload مباشر لـ fetch لأنه سيتم التعامل معه من قبل API الوسيط
      payload = null; // سيتم تمرير المعلمات في الـ URL
      
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "نوع طلب غير صالح." }),
      };
    }

    const fetchOptions = {
      method: "GET", // API Botdevx.html غالبًا يستخدم GET للصور
      headers: {
        // لا نحتاج إلى Content-Type: application/json إذا كان payload فارغًا
        // وقد تحتاج لإضافة Origin أو Referer إذا كان API يتطلب ذلك
      },
    };

    if (payload) { // فقط لطلبات الدردشة
      fetchOptions.method = "POST";
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(payload);
    }
    
    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response (${response.status}):`, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `خطأ من API توليد الصورة: ${errorText}` }),
      };
    }

    if (isImageGeneration) {
      // API Botdevx.html يُرجع blob مباشرة
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      if (!base64) {
        console.error("Image generation API did not return base64 data.");
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "لم يتم استلام بيانات صورة صالحة من API." }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ image: base64, uri: null }),
      };
    }

    // لطلبات الدردشة، نُرجع النتيجة كما هي من Gemini API
    const result = await response.json();
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
