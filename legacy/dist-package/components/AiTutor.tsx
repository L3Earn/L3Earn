import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Bot, Loader2, Target } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToTutor } from '../services/geminiService';

interface AiTutorProps {
  isOpen: boolean;
  onClose: () => void;
  contextContent?: string;
  contextLabel?: string;
  onClearContext?: () => void;
}

export const AiTutor: React.FC<AiTutorProps> = ({ isOpen, onClose, contextContent, contextLabel, onClearContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your Learn to Earn AI Tutor. I can help you understand this content, summarize key points, or help you turn your notes into profitable insights. What's on your mind?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToTutor(messages, input, contextContent);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      // Error handling is inside service, but fallback here just in case
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 transform transition-transform duration-300">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Tutor</h3>
            <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-bold">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Context Banner */}
      {contextLabel && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between animate-fade-in">
          <div className="flex items-center text-xs text-indigo-800 font-medium truncate pr-2">
            <Target size={12} className="mr-1.5 shrink-0 text-indigo-500" />
            <span className="truncate">Focus: {contextLabel}</span>
          </div>
          {onClearContext && (
            <button 
              onClick={onClearContext}
              className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full hover:bg-indigo-100 transition-colors"
              title="Clear context focus"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
                 {/* Basic rendering of text, in a real app use ReactMarkdown */}
                 {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                 ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Thinking...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={contextLabel ? `Ask about "${contextLabel.substring(0, 15)}..."` : "Ask anything..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="mt-2 flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {['Explain this', 'Summarize', 'Quiz me'].map(suggestion => (
                <button 
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="flex-shrink-0 text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                    <Sparkles size={10} className="inline mr-1" />
                    {suggestion}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};