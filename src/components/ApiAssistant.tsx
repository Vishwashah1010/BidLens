import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Mic, MicOff, RefreshCw, Bot, User, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function ApiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "What brings you here today? Feel free to ask anything.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(1); // Exclude initial greeting
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history }),
      });

      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      console.error("[Assistant Error]", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I am having trouble connecting to the backend service. Let me know how I can help you find something else!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startSpeechToText = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "model",
        text: "What brings you here today? Feel free to ask anything.",
      },
    ]);
  };

  return (
    <div className="fixed bottom-12 right-6 z-50 font-sans">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0052CC] hover:bg-[#0052CC]/90 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          title="Open AI Guide Assistant"
        >
          <MessageSquare className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chatbox Window */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-white border border-[#E1E4E8] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#1A1C1E] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">BidLens AI Guide</h3>
                <span className="text-[9px] text-[#A1A8B3] block font-mono">Agent: BidLens Assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => {
              const isModel = msg.role === "model";
              if (idx === 0) {
                return (
                  <div key={idx} className="w-[90%] mx-auto px-4 py-3.5 bg-white border border-[#E1E4E8] rounded-2xl shadow-3xs text-center font-sans">
                    <h4 className="font-bold text-[13px] text-slate-900 mb-1.5 font-sans">BidLens Assistant</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{msg.text}</p>
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${
                    isModel ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${
                      isModel ? "bg-slate-200 text-slate-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isModel ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                      isModel
                        ? "bg-white border border-[#E1E4E8] text-slate-700 rounded-tl-xs"
                        : "bg-[#0052CC] text-white rounded-tr-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="w-6 h-6 rounded-full shrink-0 bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white border border-[#E1E4E8] text-slate-400 rounded-2xl rounded-tl-xs text-[11.5px] italic animate-pulse">
                  BidLens Assistant is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips - Rendered only when logs are minimal */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-[#E1E4E8] space-y-1.5 shrink-0 text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Common Inquiries</span>
              <div className="space-y-1">
                {[
                  { label: "How do I run a compliance audit? 🔍", text: "How do I run a compliance audit?" },
                  { label: "How does the Offline Fallback work? 💡", text: "How does the Offline Fallback work?" },
                  { label: "What is the Tribal Memory scorecard? 🧠", text: "What is the Tribal Memory scorecard?" },
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(sug.text)}
                    className="w-full text-left p-2 bg-white hover:bg-slate-50 border border-[#E1E4E8] rounded-xl text-[10.5px] font-medium text-slate-700 flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <span>{sug.label}</span>
                    <ArrowRight className="w-3 h-3 text-[#A1A8B3] group-hover:text-[#0052CC] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 border-t border-[#E1E4E8] bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-1.5"
            >
              <div className="flex-1 bg-slate-50 border border-[#E1E4E8] rounded-full px-3 py-1.5 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={startSpeechToText}
                  className={`p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer ${
                    isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title={isListening ? "Listening..." : "Voice input"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center hover:bg-[#0052CC]/90 transition-colors disabled:opacity-40 cursor-pointer shadow-sm shrink-0"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="text-[9px] text-center text-slate-400 font-mono mt-1.5 flex items-center justify-center gap-1 select-none">
              <span>●</span> Powered by Gemini 3.5 Flash
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
