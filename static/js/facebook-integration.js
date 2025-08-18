/**
 * Facebook Integration Ready Script
 * Prepares the chatbot for Facebook Messenger Platform integration
 */

class FacebookIntegration {
    constructor() {
        this.isConnected = false;
        this.pageId = null;
        this.accessToken = null;
        this.webhookVerified = false;
        
        this.init();
    }
    
    init() {
        this.checkIntegrationStatus();
        this.setupIntegrationUI();
        this.loadFacebookSDK();
        this.loadSavedToken();
    }
    
    loadSavedToken() {
        const savedToken = localStorage.getItem('facebook_page_token');
        if (savedToken) {
            const status = document.getElementById('facebook-status');
            if (status) {
                status.innerHTML = '<i class="fas fa-circle text-success me-1"></i> متصل بفيسبوك';
            }
        }
    }
    
    checkIntegrationStatus() {
        // Check if Facebook integration is configured
        const status = document.getElementById('facebook-status');
        
        // Only update status if element exists
        if (!status) return;
        
        // This would typically check server-side configuration
        // For now, we'll simulate the status
        if (this.hasEnvironmentVariables()) {
            status.innerHTML = '<i class="fas fa-circle text-success me-1"></i> متصل';
            this.isConnected = true;
        } else {
            status.innerHTML = '<i class="fas fa-circle text-warning me-1"></i> جاهز للإعداد';
        }
    }
    
    hasEnvironmentVariables() {
        // In a real implementation, this would check if required environment variables are set
        // For demo purposes, return false
        return false;
    }
    
    setupIntegrationUI() {
        // Add integration instructions or controls if needed
        this.addIntegrationPanel();
    }
    
    addIntegrationPanel() {
        const sidebarContent = document.querySelector('.sidebar-content');
        if (!sidebarContent) return;
        
        const integrationPanel = document.createElement('div');
        integrationPanel.className = 'integration-panel mt-4';
        integrationPanel.innerHTML = `
            <hr style="border-color: rgba(255,255,255,0.2);">
            <h6 style="color: rgba(255,255,255,0.9); font-size: 0.9rem;">إعداد سريع</h6>
            <div class="d-grid gap-2">
                <button class="btn btn-light btn-sm" onclick="facebookIntegration.showSetupInstructions()">
                    <i class="fab fa-facebook me-1"></i>
                    دليل الإعداد
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="facebookIntegration.testWebhook()">
                    <i class="fas fa-link me-1"></i>
                    اختبار الرابط
                </button>
            </div>
            
            <div class="mt-3">
                <small style="color: rgba(255,255,255,0.7);">
                    <i class="fas fa-info-circle me-1"></i>
                    جاهز لمنصة فيسبوك ماسنجر
                </small>
            </div>
        `;
        
        sidebarContent.appendChild(integrationPanel);
    }
    
    loadFacebookSDK() {
        // Load Facebook SDK for web if needed
        if (typeof FB === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.onload = () => {
                this.initFacebookSDK();
            };
            document.head.appendChild(script);
        }
    }
    
    initFacebookSDK() {
        // Initialize Facebook SDK
        // Note: This requires a valid Facebook App ID
        if (typeof FB !== 'undefined') {
            FB.init({
                appId: 'YOUR_FACEBOOK_APP_ID', // Replace with actual App ID
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            
            console.log('Facebook SDK initialized');
        }
    }
    
    showSetupInstructions() {
        const modal = this.createSetupModal();
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    createSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fab fa-facebook-messenger text-primary me-2"></i>
                            إعداد ربط فيسبوك ماسنجر
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${this.getSetupInstructions()}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        <a href="https://developers.facebook.com/apps/" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt me-1"></i>
                            فتح مطوري فيسبوك
                        </a>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }
    
    getSetupInstructions() {
        return `
            <div class="setup-instructions">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>الشات بوت جاهز للربط مع فيسبوك!</strong> 
                    اتبع هذه الخطوات لربطه بفيسبوك ماسنجر.
                </div>
                
                <h6>1. إنشاء تطبيق فيسبوك</h6>
                <ul>
                    <li>اذهب إلى <a href="https://developers.facebook.com/apps/" target="_blank">مطوري فيسبوك</a></li>
                    <li>انقر "إنشاء تطبيق" واختر "أعمال"</li>
                    <li>أضف منتج "ماسنجر" إلى تطبيقك</li>
                </ul>
                
                <h6>2. إعداد الـ Webhook</h6>
                <ul>
                    <li><strong>رابط الـ Webhook:</strong> <code>${window.location.origin}/webhook</code></li>
                    <li><strong>رمز التحقق:</strong> ضع رمز التحقق المخصص لك</li>
                    <li><strong>حقول الاشتراك:</strong> messages, messaging_postbacks</li>
                </ul>
                
                <h6>3. متغيرات البيئة</h6>
                <p>ضع هذه المتغيرات في إعدادات النشر:</p>
                <div class="bg-light p-3 rounded" style="direction: ltr; text-align: left;">
                    <code>
                        FACEBOOK_APP_SECRET=your_app_secret<br>
                        FACEBOOK_VERIFY_TOKEN=your_verify_token<br>
                        FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token<br>
                        SESSION_SECRET=your_session_secret
                    </code>
                </div>
                
                <h6>4. ربط الصفحة</h6>
                <ul>
                    <li>أنشئ رمز وصول للصفحة (Page Access Token) لصفحة فيسبوك الخاصة بك</li>
                    <li>اشترك في تطبيقك مع الصفحة</li>
                    <li>اختبر الربط باستخدام اختبار الـ webhook</li>
                </ul>
                
                <div class="alert alert-success mt-3">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>جاهز لـ Netlify:</strong> هذا التطبيق محسن للنشر على Netlify مع جميع الإعدادات اللازمة.
                </div>
                
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-lightbulb me-2"></i>
                    <strong>نصيحة:</strong> بعد إعداد الـ webhook، ستتمكن صفحة فيسبوك من استقبال وإرسال الرسائل تلقائياً مع البوت.
                </div>
            </div>
        `;
    }
    
    async testWebhook() {
        try {
            const response = await fetch('/webhook', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                this.showTestResult('success', 'نقطة اتصال الـ webhook تعمل بشكل صحيح!');
            } else {
                this.showTestResult('warning', 'نقطة اتصال الـ webhook متاحة لكن غير مكتملة الإعداد.');
            }
        } catch (error) {
            this.showTestResult('error', 'لا يمكن الوصول لنقطة اتصال الـ webhook. تحقق من إعدادات الخادم.');
        }
    }
    
    showTestResult(type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-danger';
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'times-circle';
        
        const alert = document.createElement('div');
        alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alert.innerHTML = `
            <i class="fas fa-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
    
    // Method to send message to Facebook (placeholder)
    async sendFacebookMessage(recipientId, message) {
        if (!this.isConnected || !this.accessToken) {
            console.warn('Facebook integration not configured');
            return false;
        }
        
        try {
            const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${this.accessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient: { id: recipientId },
                    message: { text: message }
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error sending Facebook message:', error);
            return false;
        }
    }
    
    // Method to handle incoming Facebook webhooks
    handleFacebookWebhook(data) {
        if (data.object === 'page') {
            data.entry.forEach(entry => {
                entry.messaging.forEach(event => {
                    if (event.message && event.message.text) {
                        this.processFacebookMessage(event);
                    }
                });
            });
        }
    }
    
    processFacebookMessage(event) {
        const senderId = event.sender.id;
        const messageText = event.message.text;
        
        console.log(`Received message from ${senderId}: ${messageText}`);
        
        // This would typically be handled by the server
        // For now, we'll just log it
    }
}

// Initialize Facebook integration
let facebookIntegration;
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're not on the setup page
    if (!window.location.pathname.includes('facebook-setup')) {
        facebookIntegration = new FacebookIntegration();
        console.log('Facebook integration initialized and ready for setup');
    }
});

// Global functions for integration
window.facebookIntegration = {
    showSetupInstructions: () => facebookIntegration.showSetupInstructions(),
    testWebhook: () => facebookIntegration.testWebhook()
};

// Global function to save token
function saveToken() {
    const tokenInput = document.getElementById('page-access-token');
    const token = tokenInput.value.trim();
    
    if (!token) {
        showMessage('الرجاء إدخال رمز الوصول!', 'warning');
        return;
    }
    
    // Save token to localStorage (in production, send to server)
    localStorage.setItem('facebook_page_token', token);
    
    // Update status
    const status = document.getElementById('facebook-status');
    if (status) {
        status.innerHTML = '<i class="fas fa-circle text-success me-1"></i> متصل بفيسبوك';
    }
    
    // Clear input
    tokenInput.value = '';
    
    // Show success message
    showMessage('تم حفظ رمز الوصول بنجاح!', 'success');
}

// Global function to show messages
function showMessage(message, type = 'info') {
    // Create temporary alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 400px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacebookIntegration;
}
