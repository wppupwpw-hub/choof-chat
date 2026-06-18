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
    دالة جلب التوكن باستخدام المعرفات الصحيحة
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
        if response.status_code == 200:
            res_json = response.json()
            token = res_json.get('AccessToken') or res_json.get('access_token') or res_json.get('accessToken') or res_json.get('token')
            if token:
                return token, "OK"
            else:
                return None, f"Token key missing in response: {list(res_json.keys())}"
        return None, f"Token API failed: Status {response.status_code}"
    except Exception as e:
        return None, f"Token connection error: {str(e)}"

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """
    مسار التحقق لفيسبوك ميسنجر
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
    مسار استقبال الرسائل مع فحص شامل وتلقائي لجميع مسارات الـ API المحتملة لـ Chat Smith
    """
    body = request.get_json()
    if body.get('object') == 'page':
        for entry in body.get('entry', []):
            for webhook_event in entry.get('messaging', []):
                sender_psid = webhook_event.get('sender', {}).get('id')
                if webhook_event.get('message') and webhook_event['message'].get('text'):
                    user_message = webhook_event['message']['text']
                    
                    print(f"Received message: {user_message} from {sender_psid}")
                    
                    # جلب التوكن أولاً
                    chat_smith_token, token_status = get_chat_smith_token()
                    
                    if chat_smith_token and token_status == "OK":
                        # قائمة بكافة المسارات المحتملة لـ Chat Smith لتجربتها بالكامل تلقائياً
                        endpoints_to_try = [
                            'https://api.vulcanlabs.co/smith-chat/api/v1/chat',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/conversation',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/conversations',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/chat/message',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/chat/messages',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/message',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/messages',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/send',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/chat/send',
                            'https://api.vulcanlabs.co/smith-chat/api/v2/chat',
                            'https://api.vulcanlabs.co/smith-chat/api/v1/completions'
                        ]
                        
                        # قائمة بهياكل البيانات المرسلة المحتملة
                        payloads_to_try = [
                            {"text": user_message},
                            {"message": user_message},
                            {"prompt": user_message},
                            {"messages": [{"role": "user", "content": user_message}]}
                        ]
                        
                        smith_res = None
                        successful_url = ""
                        last_error_log = ""
                        
                        smith_headers = {
                            'Authorization': f'Bearer {chat_smith_token}',
                            'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
                            'user-agent': 'Chat Smith Android, Version 8.251222.2(1211)',
                            'x-vulcan-request-id': str(random.randint(1000000000, 9999999999)),
                            'content-type': 'application/json',
                            'accept': '*/*'
                        }
                        
                        # فحص وتجربة كافة التراكيب تلقائياً
                        for smith_url in endpoints_to_try:
                            for payload in payloads_to_try:
                                try:
                                    res = requests.post(smith_url, json=payload, headers=smith_headers, timeout=5)
                                    print(f"Trying {smith_url} with payload {list(payload.keys())[0]} -> Status: {res.status_code}")
                                    
                                    if res.status_code == 200:
                                        smith_res = res
                                        successful_url = smith_url
                                        break
                                    else:
                                        # تسجيل تفاصيل آخر خطأ للفحص إذا فشلت جميع المحاولات
                                        last_error_log = f"URL: {smith_url.split('/')[-1]} | Code: {res.status_code} | Response: {res.text[:200]}"
                                except Exception as e:
                                    last_error_log = f"Error connecting to {smith_url.split('/')[-1]}: {str(e)}"
                            if smith_res and smith_res.status_code == 200:
                                break
                        
                        # معالجة النتيجة النهائية
                        if smith_res and smith_res.status_code == 200:
                            res_chat = smith_res.json()
                            # استخراج الإجابة الذكية بأي مسمى حقل محتمل
                            bot_response = (
                                res_chat.get('reply') or 
                                res_chat.get('Reply') or 
                                res_chat.get('response') or 
                                res_chat.get('Response') or 
                                res_chat.get('text') or 
                                (res_chat.get('choices', [{}])[0].get('message', {}).get('content') if res_chat.get('choices') else None) or
                                "تم استقبال الرد من السيرفر ولكن لم نجد نص الإجابة بداخل الحقول المعتادة."
                            )
                            # طباعة المسار الناجح في الـ Logs لتثبيته لاحقاً
                            print(f"[SUCCESS] Found working endpoint: {successful_url}")
                        else:
                            bot_response = f"فشلت جميع محاولات الفحص الـ 11.\nآخر رد تفصيلي من السيرفر:\n{last_error_log}"
                    else:
                        bot_response = f"عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي.\n(التشخيص: {token_status})"
                    
                    # إرسال الرد النهائي للمستخدم عبر ميسنجر
                    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
                    requests.post(url, json={"recipient": {"id": sender_psid}, "message": {"text": bot_response}})
                    
        return "EVENT_RECEIVED", 200
    return "Not Found", 404

if __name__ == '__main__':
    app.run(port=5000)
