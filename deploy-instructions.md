# خطوات النشر - شات بوت فيسبوك ماسنجر

## 1. تحميل الملفات
تم إنشاء ملف `facebook-chatbot.zip` يحتوي على جميع ملفات المشروع.

## 2. رفع إلى GitHub
```bash
# إنشاء مستودع جديد على GitHub
# ثم فك ضغط الملف ورفعه:

unzip facebook-chatbot.zip
cd facebook-chatbot
git init
git add .
git commit -m "Arabic Facebook Messenger Chatbot"
git remote add origin https://github.com/username/facebook-chatbot.git
git push -u origin main
```

## 3. نشر على Netlify
1. اذهب إلى https://app.netlify.com
2. انقر "New site from Git"
3. اختر GitHub والمستودع الخاص بك
4. إعدادات البناء:
   - Build command: `pip install -r requirements-deploy.txt`
   - Publish directory: `.`
   - Python version: 3.11

## 4. متغيرات البيئة (في Netlify)
```
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_VERIFY_TOKEN=my_verify_token_123  
FACEBOOK_PAGE_ACCESS_TOKEN=your-page-access-token
SESSION_SECRET=your-random-secret-here
```

## 5. إعداد فيسبوك Webhook
- URL: `https://your-app-name.netlify.app/webhook`
- Verify Token: `my_verify_token_123`
- Subscription Fields: `messages`, `messaging_postbacks`

## 6. اختبار
بعد النشر:
1. اذهب إلى موقعك المنشور
2. انقر "دليل الربط" للتعليمات التفصيلية
3. أدخل Page Access Token في الشريط الجانبي
4. اختبر البوت!