import os
from flask import Flask, request
import requests
import random

app = Flask(__name__)

# جلب المتغيرات من البيئة الآمنة في Render
PAGE_ACCESS_TOKEN = os.getenv('PAGE_ACCESS_TOKEN')
MY_VERIFY_TOKEN = os.getenv('VERIFY_TOKEN')
CHAT_SMITH_DEVICE_ID = os.getenv('CHAT_SMITH_DEVICE_ID', '378F55C6F5BDFD8D')

def get_chat_smith_token():
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
        "order_id": "", "product_id": "", "purchase_token": "", "subscription_id": ""
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.json().get('access_token', None)
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    if mode and token == MY_VERIFY_TOKEN:
        return challenge, 200
    return "Forbidden", 403

@app.route('/webhook', methods=['POST'])
def handle_messages():
    body = request.get_json()
    if body.get('object') == 'page':
        for entry in body.get('entry', []):
            for webhook_event in entry.get('messaging', []):
                sender_psid = webhook_event.get('sender', {}).get('id')
                if webhook_event.get('message') and webhook_event['message'].get('text'):
                    user_message = webhook_event['message']['text']
                    
                    chat_smith_token = get_chat_smith_token()
                    bot_response = "عذراً، واجهت مشكلة في معالجة الرد."
                    
                    if chat_smith_token:
                        try:
                            smith_url = 'https://api.vulcanlabs.co/smith-chat/api/v1/chat'
                            smith_headers = {
                                'Authorization': f'Bearer {chat_smith_token}',
                                'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt',
                                'content-type': 'application/json'
                            }
                            smith_res = requests.post(smith_url, json={"text": user_message}, headers=smith_headers)
                            if smith_res.status_code == 200:
                                bot_response = smith_res.json().get('reply', bot_response)
                        except Exception as e:
                            print(f"Error: {e}")
                    
                    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
                    requests.post(url, json={"recipient": {"id": sender_psid}, "message": {"text": bot_response}})
        return "EVENT_RECEIVED", 200
    return "Not Found", 404

if __name__ == '__main__':
    app.run(port=5000)
