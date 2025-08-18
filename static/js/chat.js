/**
 * Facebook Messenger-style Chatbot Interface
 * Handles chat functionality, message display, and user interactions
 */

class ChatInterface {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.chatForm = document.getElementById('chat-form');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
        
        this.isTyping = false;
        this.messageQueue = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.focusInput();
    }
    
    setupEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
        
        // Input field events
        this.messageInput.addEventListener('input', () => {
            this.adjustInputHeight();
            this.updateSendButton();
        });
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Send button
        this.sendButton.addEventListener('click', () => {
            this.handleSendMessage();
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Focus input when typing (if not already focused)
            if (!this.messageInput.matches(':focus') && 
                e.key.length === 1 && 
                !e.ctrlKey && 
                !e.altKey && 
                !e.metaKey) {
                this.messageInput.focus();
            }
            
            // Escape to clear input
            if (e.key === 'Escape') {
                this.clearInput();
            }
        });
    }
    
    handleSendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) {
            return;
        }
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.clearInput();
        
        // Show typing indicator and get bot response
        this.getBotResponse(message);
    }
    
    async getBotResponse(userMessage) {
        try {
            this.showTypingIndicator();
            this.isTyping = true;
            
            // Simulate thinking time
            await this.delay(800 + Math.random() * 1200);
            
            const response = await this.sendToServer(userMessage);
            
            this.hideTypingIndicator();
            this.isTyping = false;
            
            if (response.response) {
                await this.delay(300); // Brief pause before showing response
                this.addMessage(response.response, 'bot');
            } else {
                throw new Error('No response received');
            }
            
        } catch (error) {
            console.error('Error getting bot response:', error);
            this.hideTypingIndicator();
            this.isTyping = false;
            
            this.addMessage(
                "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
                'bot'
            );
        }
    }
    
    async sendToServer(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        // Handle multi-line messages
        const paragraphs = text.split('\n').filter(p => p.trim());
        paragraphs.forEach((paragraph, index) => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            p.className = index === paragraphs.length - 1 ? 'mb-0' : 'mb-1';
            bubble.appendChild(p);
        });
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(new Date());
        
        content.appendChild(bubble);
        content.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Announce message to screen readers
        this.announceMessage(text, sender);
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    clearInput() {
        this.messageInput.value = '';
        this.adjustInputHeight();
        this.updateSendButton();
        this.focusInput();
    }
    
    focusInput() {
        setTimeout(() => {
            this.messageInput.focus();
        }, 100);
    }
    
    adjustInputHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
        
        if (this.isTyping) {
            this.sendButton.classList.add('loading');
        } else {
            this.sendButton.classList.remove('loading');
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    announceMessage(text, sender) {
        // Create invisible element for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${sender === 'user' ? 'You said' : 'Bot replied'}: ${text}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global chat functions
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        const chatMessages = document.getElementById('chat-messages');
        const messages = chatMessages.querySelectorAll('.message:not(.welcome-message)');
        
        messages.forEach(message => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        });
        
        // Reset to welcome message only
        setTimeout(() => {
            location.reload();
        }, 500);
    }
}

function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('error-message').textContent = message;
    errorModal.show();
}

// Quick reply functionality
function addQuickReply(text) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = text;
    messageInput.focus();
    chat.updateSendButton();
}

// Export common phrases for quick access
const quickReplies = [
    "Hello!",
    "How can you help me?",
    "What can you do?",
    "Thank you",
    "Goodbye"
];

// Add CSS for fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
`;
document.head.appendChild(style);

// Initialize chat interface when DOM is loaded
let chat;
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if chat elements exist
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chat = new ChatInterface();
        console.log('Facebook Messenger Chatbot Interface initialized');
        console.log('Ready for Facebook integration');
    }
});

// Handle page visibility for better UX
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && chat) {
        chat.focusInput();
    }
});

// Handle connection status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    if (chat) {
        showError('You appear to be offline. Please check your internet connection.');
    }
});
