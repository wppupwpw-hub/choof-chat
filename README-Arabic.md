# شات بوت فيسبوك ماسنجر - دليل النشر

## نظرة عامة
شات بوت ذكي باللغة العربية مع دعم كامل لفيسبوك ماسنجر Platform. يدعم اللغتين العربية والإنجليزية مع واجهة RTL كاملة.

## الميزات
- ✅ واجهة عربية كاملة مع دعم RTL
- ✅ بوت ذكي يستجيب بالعربية والإنجليزية
- ✅ ربط كامل مع Facebook Graph API
- ✅ Webhook جاهز لفيسبوك ماسنجر
- ✅ واجهة ويب للدردشة المباشرة
- ✅ دليل إعداد شامل

## متطلبات النشر

### 1. Netlify
```
البيئة: Python 3.11
أمر البناء: pip install -r requirements.txt
مجلد النشر: .
```

### 2. متغيرات البيئة المطلوبة
```
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=my_verify_token_123
FACEBOOK_PAGE_ACCESS_TOKEN=your-page-access-token
SESSION_SECRET=your-random-secret-key
```

### 3. إعداد فيسبوك
1. اذهب إلى https://developers.facebook.com/apps/
2. أنشئ تطبيق جديد واختر "Business"
3. أضف منتج "Messenger"
4. في إعدادات Webhook:
   - URL: `https://your-app-name.netlify.app/webhook`
   - Verify Token: `my_verify_token_123`
   - Subscription Fields: `messages`, `messaging_postbacks`

## ملفات المشروع
```
├── app.py                 # التطبيق الرئيسي
├── main.py               # نقطة الدخول
├── netlify.toml          # إعدادات Netlify
├── requirements.txt      # متطلبات Python
├── templates/
│   ├── index.html       # واجهة الشات
│   ├── facebook_setup.html  # دليل الإعداد
│   └── base.html        # القالب الأساسي
└── static/
    ├── css/style.css    # التصميم
    ├── js/chat.js       # وظائف الشات
    └── js/facebook-integration.js  # ربط فيسبوك
```

## خطوات النشر على Netlify

### 1. رفع إلى GitHub
```bash
git init
git add .
git commit -m "Facebook Messenger Chatbot"
git remote add origin https://github.com/username/facebook-chatbot.git
git push -u origin main
```

### 2. ربط مع Netlify
1. اذهب إلى https://app.netlify.com
2. انقر "New site from Git"
3. اختر GitHub واختر المستودع
4. إعدادات البناء:
   - Build command: `pip install -r requirements.txt`
   - Publish directory: `.`

### 3. إضافة متغيرات البيئة
في لوحة تحكم Netlify:
1. اذهب إلى Site settings → Environment variables
2. أضف المتغيرات المطلوبة

## الاستخدام
1. ادخل إلى الموقع المنشور
2. انقر "دليل الربط" للحصول على تعليمات فيسبوك
3. أدخل Page Access Token في الشريط الجانبي
4. اختبر البوت عبر الواجهة أو فيسبوك ماسنجر

## الدعم
للمساعدة في الإعداد، راجع صفحة "دليل الربط" في التطبيق.