import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Sparkles, HelpCircle,
    BookOpen, Video, FileText, MessageSquare,
    ThumbsUp, ThumbsDown, Copy, Check, X,
    Zap, Clock, AlertCircle, ChevronRight
} from 'lucide-react';

const ChatbotPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hello! I'm your AI assistant for the Face Recognition System. How can I help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: ['Train Model', 'View Attendance', 'Add Student', 'Live Recognition']
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Focus input on mount
        inputRef.current?.focus();
    }, []);

    // Generate suggestions based on input
    useEffect(() => {
        if (input.length > 2) {
            const commonQueries = [
                'How to train model',
                'View attendance records',
                'Add new student',
                'Recognition not working',
                'Export attendance',
                'System requirements',
                'Camera setup',
                'Accuracy issues'
            ].filter(q => q.toLowerCase().includes(input.toLowerCase()));
            setSuggestions(commonQueries);
        } else {
            setSuggestions([]);
        }
    }, [input]);

    const knowledgeBase = {
        'train': {
            reply: "To train the model, follow these steps:\n\n1. Go to the 'Train Model' page\n2. Ensure you have at least 20-30 images per student\n3. Click 'Start Training'\n4. Wait for the process to complete (usually 2-3 minutes)\n5. The model will automatically save and be ready for recognition",
            links: ['/train', '/students'],
            category: 'training'
        },
        'attendance': {
            reply: "You can manage attendance in several ways:\n\n• View today's attendance in real-time\n• Export reports as PDF or Excel\n• Filter by date, department, or status\n• Mark manual attendance if needed\n• View attendance analytics and trends",
            links: ['/attendance', '/dashboard'],
            category: 'attendance'
        },
        'student': {
            reply: "To manage students:\n\n• Add new students with their photos\n• Edit or update student information\n• Bulk import via CSV\n• Assign to departments and courses\n• View student recognition history",
            links: ['/students'],
            category: 'students'
        },
        'recognition': {
            reply: "For live recognition:\n\n1. Go to 'Live Recognition' page\n2. Ensure your camera is connected and permissions granted\n3. Click 'Start Recognition'\n4. The system will automatically detect and mark attendance\n5. You can see confidence scores for each detection",
            links: ['/recognition'],
            category: 'recognition'
        },
        'camera': {
            reply: "Camera troubleshooting:\n\n• Check if camera is connected\n• Ensure browser has camera permissions\n• Try refreshing the page\n• Close other apps using camera\n• Check camera in another app to verify hardware",
            links: ['/recognition'],
            category: 'troubleshooting'
        },
        'accuracy': {
            reply: "To improve recognition accuracy:\n\n• Ensure good lighting conditions\n• Use high-quality training images\n• Train with multiple angles and expressions\n• Minimum 30 images per person recommended\n• Regular model retraining with new data",
            links: ['/train'],
            category: 'training'
        },
        'export': {
            reply: "Export options available:\n\n• PDF reports with charts and summaries\n• Excel/CSV for data analysis\n• Print directly from attendance page\n• Schedule automated email reports\n• Custom date range selection",
            links: ['/attendance'],
            category: 'reports'
        },
        'help': {
            reply: "I can help you with:\n\n🔧 Training & Model Management\n📊 Attendance Tracking\n👥 Student Management\n🎥 Live Recognition\n📈 Reports & Analytics\n⚙️ System Settings\n🔍 Troubleshooting",
            links: ['/help'],
            category: 'general'
        }
    };

    const getBotResponse = (query) => {
        const lowerQuery = query.toLowerCase();

        // Check for matches in knowledge base
        for (const [key, value] of Object.entries(knowledgeBase)) {
            if (lowerQuery.includes(key)) {
                return value;
            }
        }

        // Default responses for common queries
        if (lowerQuery.match(/\b(hi|hello|hey|greetings)\b/)) {
            return {
                reply: "Hello! 👋 How can I assist you with the Face Recognition System today?",
                category: 'greeting'
            };
        }

        if (lowerQuery.match(/\b(thanks|thank you|appreciate)\b/)) {
            return {
                reply: "You're welcome! 😊 Is there anything else I can help you with?",
                category: 'gratitude'
            };
        }

        return {
            reply: "I'm not sure about that. Could you please rephrase or check these topics:\n\n• Training the model\n• Viewing attendance\n• Adding students\n• Live recognition\n• Troubleshooting camera issues\n• Exporting reports",
            suggestions: ['Train Model', 'View Attendance', 'Camera Issues', 'Export Reports'],
            category: 'unknown'
        };
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSuggestions([]);
        setIsTyping(true);

        // Simulate typing delay based on response length
        const response = getBotResponse(input);
        const delay = Math.min(1000, Math.max(500, response.reply.length * 10));

        setTimeout(() => {
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: response.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                links: response.links,
                suggestions: response.suggestions,
                category: response.category
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, delay);
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    const handleCopyMessage = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFeedback = (type, messageId) => {
        console.log(`Feedback ${type} for message ${messageId}`);
        // Here you would send feedback to your analytics
    };

    const quickActions = [
        { icon: BookOpen, label: 'Documentation', action: () => handleSuggestionClick('How to use the system') },
        { icon: Video, label: 'Video Tutorial', action: () => handleSuggestionClick('video tutorial') },
        { icon: FileText, label: 'User Guide', action: () => handleSuggestionClick('user guide') },
        { icon: Zap, label: 'Quick Tips', action: () => handleSuggestionClick('tips') },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">AI Help Desk</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Get instant answers about the Face Recognition System
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={index}
                                        onClick={action.action}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Icon size={16} className="text-gray-400" />
                                        <span>{action.label}</span>
                                        <ChevronRight size={14} className="ml-auto text-gray-400" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Popular Topics */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular Topics</h3>
                        <div className="space-y-2">
                            {[
                                'How to train model?',
                                'Camera not working',
                                'Export attendance',
                                'Add multiple students',
                                'Improve accuracy'
                            ].map((topic, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(topic)}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-gray-600">System Status</span>
                        </div>
                        <p className="text-xs text-gray-500">All systems operational</p>
                        <p className="text-xs text-gray-400 mt-1">Model accuracy: 94.2%</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl border border-gray-200 h-[calc(85vh-120px)] flex flex-col">
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Online · Usually replies instantly
                                    </p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                <HelpCircle size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] group`}>
                                            <div className="flex items-start gap-2">
                                                {msg.type === 'bot' && (
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Bot size={16} className="text-gray-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div
                                                        className={`px-5 py-3 rounded-2xl ${msg.type === 'user'
                                                                ? 'bg-gray-900 text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                            }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                                                        {/* Links */}
                                                        {msg.links && msg.links.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {msg.links.map((link, i) => (
                                                                    <button
                                                                        key={i}
                                                                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                                                                    >
                                                                        Go to {link}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Suggestions */}
                                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {msg.suggestions.map((suggestion, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                                                                    >
                                                                        {suggestion}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Message Footer */}
                                                    <div className="flex items-center gap-2 mt-1 px-2">
                                                        <span className="text-xs text-gray-400">{msg.timestamp}</span>

                                                        {msg.type === 'bot' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCopyMessage(msg.text, msg.id)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    {copiedId === msg.id ? (
                                                                        <Check size={12} className="text-green-500" />
                                                                    ) : (
                                                                        <Copy size={12} className="text-gray-400 hover:text-gray-600" />
                                                                    )}
                                                                </button>

                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleFeedback('like', msg.id)}
                                                                        className="hover:text-gray-600"
                                                                    >
                                                                        <ThumbsUp size={10} className="text-gray-400" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleFeedback('dislike', msg.id)}
                                                                        className="hover:text-gray-600"
                                                                    >
                                                                        <ThumbsDown size={10} className="text-gray-400" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {msg.type === 'user' && (
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <User size={16} className="text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Bot size={16} className="text-gray-600" />
                                            </div>
                                            <div className="bg-gray-100 px-5 py-3 rounded-2xl">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="px-6 py-4 border-t border-gray-200">
                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    placeholder="Type your question here..."
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isTyping}
                                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${input.trim() && !isTyping
                                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>

                            {/* Quick Tips */}
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                <Sparkles size={12} />
                                <span>Try: "How to train model", "Camera not working", "Export attendance"</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatbotPage;