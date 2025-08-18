import os
import logging
from flask import Flask, render_template, request, jsonify
import json
import hashlib
import hmac

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "fallback-secret-key-for-development")

# Facebook configuration
FACEBOOK_APP_SECRET = os.environ.get("FACEBOOK_APP_SECRET", "your-app-secret")
FACEBOOK_VERIFY_TOKEN = os.environ.get("FACEBOOK_VERIFY_TOKEN", "your-verify-token")
FACEBOOK_PAGE_ACCESS_TOKEN = os.environ.get("FACEBOOK_PAGE_ACCESS_TOKEN", "your-page-access-token")

@app.route('/')
def index():
    """Main chatbot interface"""
    return render_template('index.html')

@app.route('/facebook-setup')
def facebook_setup():
    """Facebook integration setup page with all required information"""
    webhook_url = f"{request.url_root}webhook"
    return render_template('facebook_setup.html', webhook_url=webhook_url)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages from the web interface"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Simple chatbot logic - replace with your actual AI/NLP logic
        bot_response = generate_bot_response(user_message)
        
        import time
        return jsonify({
            'response': bot_response,
            'timestamp': str(int(time.time() * 1000))
        })
    
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    """Facebook Messenger webhook endpoint"""
    if request.method == 'GET':
        # Webhook verification
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        
        if token == FACEBOOK_VERIFY_TOKEN:
            logging.info("Webhook verified successfully")
            return challenge
        else:
            logging.warning("Webhook verification failed")
            return 'Verification failed', 403
    
    elif request.method == 'POST':
        # Handle incoming messages from Facebook
        try:
            # Verify the request signature
            signature = request.headers.get('X-Hub-Signature-256')
            if not verify_webhook_signature(request.data, signature):
                logging.warning("Invalid webhook signature")
                return 'Invalid signature', 403
            
            data = request.get_json()
            
            if data.get('object') == 'page':
                for entry in data.get('entry', []):
                    for messaging_event in entry.get('messaging', []):
                        handle_facebook_message(messaging_event)
            
            return 'OK', 200
        
        except Exception as e:
            logging.error(f"Error handling webhook: {str(e)}")
            return 'Error', 500

def verify_webhook_signature(payload, signature):
    """Verify that the webhook request is from Facebook"""
    if not signature:
        return False
    
    try:
        expected_signature = hmac.new(
            FACEBOOK_APP_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Remove 'sha256=' prefix from signature
        signature = signature.replace('sha256=', '')
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False

def handle_facebook_message(messaging_event):
    """Process incoming Facebook messages"""
    try:
        sender_id = messaging_event.get('sender', {}).get('id')
        message = messaging_event.get('message', {})
        
        if message.get('text'):
            user_message = message['text']
            logging.info(f"Received message from {sender_id}: {user_message}")
            
            # Generate bot response
            bot_response = generate_bot_response(user_message)
            
            # Send response back to Facebook (implement send_facebook_message)
            send_facebook_message(sender_id, bot_response)
    
    except Exception as e:
        logging.error(f"Error handling Facebook message: {str(e)}")

def send_facebook_message(recipient_id, message_text):
    """Send a message to Facebook Messenger using Graph API"""
    import requests
    
    if not FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_PAGE_ACCESS_TOKEN == "your-page-access-token":
        logging.warning("Facebook Page Access Token not configured")
        return False
    
    try:
        url = f"https://graph.facebook.com/v18.0/me/messages"
        headers = {
            'Content-Type': 'application/json',
        }
        params = {
            'access_token': FACEBOOK_PAGE_ACCESS_TOKEN
        }
        data = {
            'recipient': {'id': recipient_id},
            'message': {'text': message_text}
        }
        
        response = requests.post(url, headers=headers, params=params, json=data)
        
        if response.status_code == 200:
            logging.info(f"Message sent successfully to {recipient_id}")
            return True
        else:
            logging.error(f"Failed to send message: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"Error sending Facebook message: {str(e)}")
        return False

def generate_bot_response(user_message):
    """Generate chatbot response based on user input with Arabic and English support"""
    user_message_lower = user_message.lower().strip()
    
    # Arabic responses
    arabic_responses = {
        'مرحبا': 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
        'السلام عليكم': 'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك',
        'أهلا': 'أهلاً وسهلاً! كيف حالك؟',
        'كيف حالك': 'الحمد لله بخير! وأنت كيف حالك؟',
        'ما اسمك': 'أنا مساعد الدردشة الذكي، مصمم خصيصاً لفيسبوك ماسنجر',
        'مساعدة': 'أنا هنا لمساعدتك! يمكنك سؤالي عن أي شيء أو الدردشة معي',
        'شكرا': 'عفواً! هل تحتاج أي مساعدة أخرى؟',
        'شكراً': 'عفواً! هل تحتاج أي مساعدة أخرى؟',
        'وداعا': 'وداعاً! أتمنى لك يوماً سعيداً',
        'مع السلامة': 'مع السلامة! كان من دواعي سروري التحدث معك',
        'ماذا تستطيع أن تفعل': 'يمكنني الدردشة معك، الإجابة على الأسئلة، ومساعدتك في مهام مختلفة. كما أنني متصل مع فيسبوك ماسنجر',
        'كيف أربطك بفيسبوك': 'يمكنك ربطي بصفحة فيسبوك من خلال إعدادات مطوري فيسبوك. انقر على "دليل الإعداد" في الشريط الجانبي للمزيد من التفاصيل',
        'فيسبوك': 'أنا جاهز للربط مع فيسبوك ماسنجر! تحتاج إلى إعداد webhook في لوحة تحكم مطوري فيسبوك',
    }
    
    # English responses
    english_responses = {
        'hello': 'Hello! How can I help you today?',
        'hi': 'Hi there! What can I do for you?',
        'help': 'I\'m here to help! You can ask me questions or just chat.',
        'bye': 'Goodbye! Have a great day!',
        'thanks': 'You\'re welcome! Is there anything else I can help you with?',
        'how are you': 'I\'m doing great! Thanks for asking. How are you?',
        'what can you do': 'I can chat with you, answer questions, and help with various tasks. I\'m also ready for Facebook Messenger integration!',
        'facebook': 'I\'m ready to connect with Facebook Messenger! You need to set up a webhook in the Facebook Developer dashboard',
        'connect facebook': 'To connect me to Facebook, click on "Setup Guide" in the sidebar for detailed instructions',
    }
    
    # Check Arabic responses first
    for key, response in arabic_responses.items():
        if key in user_message or key in user_message_lower:
            return response
    
    # Check English responses
    for key, response in english_responses.items():
        if key in user_message_lower:
            return response
    
    # Default responses based on language detection
    if any(ord(char) > 127 for char in user_message):  # Contains non-ASCII (likely Arabic)
        return "عذراً، لم أفهم ما تقصد. هل يمكنك إعادة صياغة سؤالك؟ اكتب 'مساعدة' إذا كنت تحتاج للمساعدة"
    else:
        return "I'm not sure I understand. Could you please rephrase that? Type 'help' if you need assistance."

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
