import os
from flask import Flask, request
import requests
import random

app = Flask(__name__)

# جلب المتغيرات من البيئة الآمنة في منصة Render
PAGE_ACCESS_TOKEN = os.getenv('PAGE_ACCESS_TOKEN')
MY_VERIFY_TOKEN = os.getenv('VERIFY_TOKEN')
CHAT_SMITH_DEVICE_ID = os.getenv('CHAT_SMITH_DEVICE_ID', '378F55C6F5BDFD8D')

def get_chat_smith_token():
    """
    دالة لجلب توكن تطبيق Chat Smith وتجربة قراءة كافة مسميات الحقول الممكنة
    """
    url = 'https://api.vulcanlabs.co/smith-auth/api/v1/token'
    headers = {
        'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
        'user-agent': 'Chat Smith Android, Version 8.251222.2(1211)',
        'x-vulcan-request-id': str(random.randint(1000000000, 9999999999)),
        'content-type': 'application/json',
        'accept': '*/*'
    }
    data = {
        "device_id": CHAT_SMITH_DEVICE_ID,
        "order_id": "", 
        "product_id": "", 
        "purchase_token": "", 
        "subscription_id": ""
    }
    try:
        response = requests.post(url, json=data, headers=headers, timeout=10)
        print(f"[TOKEN API] Status Code: {response.status_code}")
        
        if response.status_code == 200:
            res_json = response.json()
            # تجربة قراءة كافة المفاتيح المحتملة للتوكن لتفادي تغيير أسماء الحقول من المصدر
            token = res_json.get('access_token') or res_json.get('accessToken') or res_json.get('token')
            
            if token:
                return token, "OK"
            else:
                # في حال لم يجد التوكن، يرجع أسماء الحقول التي أرسلها السيرفر لتشخيصها
                keys_found = list(res_json.keys())
                return None, f"Token key missing. Keys received: {keys_found}"
                
        return None, f"Token API failed with status {response.status_code}"
    except Exception as e:
        print(f"[TOKEN API] Error: {e}")
        return None, f"Token connection error: {str(e)}"

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """
    مسار التحقق الخاص بفيسبوك ميسنجر عند تفعيل الـ Webhook لأول مرة
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
    مسار استقبال الرسائل ومعالجتها وإرسال الرد الذكي
    """
    body = request.get_json()
    if body.get('object') == 'page':
        for entry in body.get('entry', []):
            for webhook_event in entry.get('messaging', []):
                sender_psid = webhook_event.get('sender', {}).get('id')
                if webhook_event.get('message') and webhook_event['message'].get('text'):
                    user_message = webhook_event['message']['text']
                    
                    print(f"Received message: {user_message} from {sender_psid}")
                    
                    # جلب التوكن الخاص بالذكاء الاصطناعي وتتبع حالته
                    chat_smith_token, token_status = get_chat_smith_token()
                    bot_response = f"عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي.\n(التشخيص: {token_status})"
                    
                    if chat_smith_token:
                        try:
                            smith_url = 'https://api.vulcanlabs.co/smith-chat/api/v1/chat'
                            smith_headers = {
                                'Authorization': f'Bearer {chat_smith_token}',
                                'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
                                'content-type': 'application/json',
                                'accept': '*/*'
                            }
                            # إرسال الرسالة إلى سيرفر الشات
                            smith_res = requests.post(smith_url, json={"text": user_message}, headers=smith_headers, timeout=10)
                            print(f"[CHAT API] Status Code: {smith_res.status_code}")
                            
                            if smith_res.status_code == 200:
                                res_chat = smith_res.json()
                                # تجربة قراءة حقل الرد بكافة أشكاله المتوقعة
                                bot_response = res_chat.get('reply') or res_chat.get('response') or res_chat.get('text') or "مرحباً! استلمت رسالتك ولكن لم أجد رداً بداخلها."
                            else:
                                bot_response = f"عذراً، سيرفر الـ AI رد برمز خطأ.\n(التشخيص: Chat API failed with status {smith_res.status_code})"
                        except Exception as e:
                            print(f"[CHAT API] Error: {e}")
                            bot_response = f"عذراً، حدث خطأ أثناء الاتصال بسيرفر الدردشة.\n(التشخيص: Chat connection error {str(e)})"
                    
                    # إرسال الرد النهائي للمستخدم عبر فيسبوك ميسنجر
                    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
                    requests.post(url, json={"recipient": {"id": sender_psid}, "message": {"text": bot_response}})
                    
        return "EVENT_RECEIVED", 200
    return "Not Found", 404

if __name__ == '__main__':
    app.run(port=5000)
