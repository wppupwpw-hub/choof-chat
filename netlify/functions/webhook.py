import os
import json
import requests
import random

# جلب المتغيرات من بيئة النظام الآمنة لـ Netlify
# يمكنك إدخال قيم هذه المتغيرات من لوحة تحكم Netlify مباشرة
PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN", "YOUR_DEFAULT_FB_PAGE_TOKEN")
MY_VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "YOUR_DEFAULT_VERIFY_TOKEN")
CHAT_SMITH_DEVICE_ID = os.getenv("CHAT_SMITH_DEVICE_ID", "378F55C6F5BDFD8D")

def get_chat_smith_token():
    """
    دالة تقوم بإرسال طلب التحقق من الهوية لتوليد توكن جديد تلقائياً
    """
    url = 'https://api.vulcanlabs.co/smith-auth/api/v1/token'
    headers = {
        'host': 'api.vulcanlabs.co',
        'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
        'user-agent': 'Chat Smith Android, Version 8.251222.2(1211)',
        'x-vulcan-request-id': str(random.randint(1000000000, 9999999999)),
        'content-type': 'application/json'
    }
    data = {
        "device_id": CHAT_SMITH_DEVICE_ID,
        "order_id": "", 
        "product_id": "", 
        "purchase_token": "", 
        "subscription_id": ""
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.json().get('access_token', None)
        return None
    except Exception as e:
        print(f"Error fetching Chat Smith Token: {e}")
        return None

def handler(event, context):
    """
    الدالة الرئيسية التي تستقبل الطلبات والرسائل من خوادم Netlify Serverless
    """
    http_method = event.get("httpMethod")

    # 1. معالجة طلب التحقق المبدئي لفيسبوك الـ Webhook (GET)
    if http_method == "GET":
        params = event.get("queryStringParameters", {})
        mode = params.get("hub.mode")
        token = params.get("hub.verify_token")
        challenge = params.get("hub.challenge")

        if mode == "subscribe" and token == MY_VERIFY_TOKEN:
            return {
                "statusCode": 200,
                "body": challenge
            }
        return {
            "statusCode": 403,
            "body": "Forbidden"
        }

    # 2. معالجة الرسائل الواردة من المستخدمين والرد عليها (POST)
    elif http_method == "POST":
        try:
            body = json.loads(event.get("body", "{}"))
        except Exception:
            return {"statusCode": 400, "body": "Invalid JSON"}

        if body.get('object') == 'page':
            for entry in body.get('entry', []):
                for webhook_event in entry.get('messaging', []):
                    sender_psid = webhook_event.get('sender', {}).get('id')
                    
                    if webhook_event.get('message') and webhook_event['message'].get('text'):
                        user_message = webhook_event['message']['text']
                        
                        # توليد التوكن الخاص بـ Chat Smith
                        chat_smith_token = get_chat_smith_token()
                        bot_response = "عذراً، واجهت مشكلة في معالجة الرد الذكي."
                        
                        if chat_smith_token:
                            try:
                                smith_url = 'https://api.vulcanlabs.co/smith-chat/api/v1/chat'
                                smith_headers = {
                                    'Authorization': f'Bearer {chat_smith_token}',
                                    'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
                                    'content-type': 'application/json'
                                }
                                # إرسال السؤال ومعالجة الإجابة من سيرفر Chat Smith
                                smith_res = requests.post(smith_url, json={"text": user_message}, headers=smith_headers)
                                if smith_res.status_code == 200:
                                    bot_response = smith_res.json().get('reply', bot_response)
                            except Exception as e:
                                print(f"Error with Chat Smith API: {e}")
                        
                        # إرسال الرسالة والرد النهائي للمستخدم في فيسبوك ماسنجر
                        fb_url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
                        fb_payload = {
                            "recipient": {"id": sender_psid},
                            "message": {"text": bot_response}
                        }
                        requests.post(fb_url, json=fb_payload)
                        
            return {
                "statusCode": 200,
                "body": "EVENT_RECEIVED"
            }
            
        return {
            "statusCode": 404,
            "body": "Not Found"
        }

    return {
        "statusCode": 405,
        "body": "Method Not Allowed"
    }
