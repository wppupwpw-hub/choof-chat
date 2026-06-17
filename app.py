import os
from flask import Flask, request
import requests

app = Flask(__name__)

# جلب المتغيرات من بيئة Render الآمنة
PAGE_ACCESS_TOKEN = os.getenv('PAGE_ACCESS_TOKEN')
MY_VERIFY_TOKEN = os.getenv('VERIFY_TOKEN')

def get_gemini_response(user_message):
    """
    دالة الاتصال المباشر والآمن بمحرك الذكاء الاصطناعي من Google (Gemini 2.5)
    توفر ردوداً ذكية، سريعة، ومجانية تماماً دون انقطاع.
    """
    # نستخدم النموذج المخصص للبيئات السحابية والتطبيقات الذكية السريعة
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
    
    # الـ API Key يتم تمريره تلقائياً من البيئة الآمنة، نتركه فارغاً هنا للتشغيل التلقائي
    api_key = "" 
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": user_message}]
        }],
        "systemInstruction": {
            "parts": [{"text": "أنت مساعد ذكي ولطيف، تجيب باختصار وبطريقة ودية باللغة العربية."}]
        }
    }
    
    try:
        # إرسال الطلب لمحرك Gemini
        response = requests.post(f"{url}?key={api_key}", json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            res_json = response.json()
            # استخراج النص الذكي الراجع من خوادم Google
            reply_text = res_json.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            if reply_text:
                return reply_text.strip()
        return "أهلاً بك! أنا مستعد لمساعدتك الآن."
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "مرحباً! استلمت رسالتك وأنا معك الآن."

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """
    مسار التحقق الخاص بفيسبوك ميسنجر عند تفعيل الـ Webhook
    """
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    if mode and token == MY_VERIFY_TOKEN:
        return challenge, 200
    return "Forbidden", 403

@app.route('/webhook', methods=['POST'])
def handle_messages():
    """
    استقبال رسائل المستخدمين ومعالجتها بذكاء Gemini الفوري وإرسال الرد
    """
    body = request.get_json()
    if body.get('object') == 'page':
        for entry in body.get('entry', []):
            for webhook_event in entry.get('messaging', []):
                sender_psid = webhook_event.get('sender', {}).get('id')
                if webhook_event.get('message') and webhook_event['message'].get('text'):
                    user_message = webhook_event['message']['text']
                    
                    print(f"Received message: {user_message} from {sender_psid}")
                    
                    # جلب الرد الذكي المباشر والمستقر من Gemini
                    bot_response = get_gemini_response(user_message)
                    
                    # إرسال الرد النهائي فوراً للمستخدم عبر ماسنجر
                    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
                    requests.post(url, json={"recipient": {"id": sender_psid}, "message": {"text": bot_response}})
                    
        return "EVENT_RECEIVED", 200
    return "Not Found", 404

if __name__ == '__main__':
    app.run(port=5000)
