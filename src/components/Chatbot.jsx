import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../utils/AuthContext";
import { usePremium } from "../utils/PremiumContext";
import Login from "./Login";
import { Link } from "react-router-dom";

import { API_ENDPOINTS, MESSAGES, CONFIG } from "../utils/constants";

export default function Chatbot({ apiUrl = API_ENDPOINTS.CHAT }) {
  const { user } = useAuth();
  const { hasChatbotAccess, isPremium, membershipType } = usePremium();
  const [messages, setMessages] = useState([
    {
      id: "bot-welcome",
      sender: "bot",
      text: "Hello 👋, I'm your RV College placement assistant. Ask me about companies, roles, packages, or placement statistics!",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();

    const userMsg = { id: `u-${Date.now()}`, sender: "user", text: trimmed, time: Date.now() };
    const placeholder = { id: `bot-loading-${Date.now()}`, sender: "bot", text: "", loading: true, time: Date.now() };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setInput("");
    setIsSending(true);

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Server returned ${resp.status}: ${errorText}`);
      }
      
      const data = await resp.json();

      // Handle response - adjust based on your backend response format
      const botText = data?.answer || data?.response || "Sorry, I couldn't find an answer.";
      const botMsg = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: botText,
        time: Date.now(),
      };

      setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? botMsg : m)));
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id 
            ? { ...m, loading: false, text: MESSAGES.BACKEND_PORT_ERROR(CONFIG.BACKEND_PORT) } 
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return <Login />;
  }

  // Check if user has chatbot access (Gold membership required)
  if (!hasChatbotAccess()) {
    return (
      <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen flex flex-col">
        <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: "85vh" }}>
          <header className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">RV Placements Assistant</h1>
                <p className="text-sm opacity-90 mt-1">AI-powered placement guidance and insights</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Gold Required</span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto bg-gradient-to-b from-indigo-50/30 to-white flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Gold Membership Required</h3>
                <p className="text-gray-600 mb-4">
                  The AI Chatbot is exclusively available for Gold members. Get instant answers about companies, packages, and placement trends.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-3">Gold Membership Benefits</h4>
                <div className="text-sm text-yellow-800 space-y-2 text-left">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Access to all company videos</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>AI-powered placement assistant</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Real-time placement insights</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Company-specific guidance</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  to="/premium" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Upgrade to Gold - ₹700
                </Link>
                
                {isPremium && membershipType === 'silver' && (
                  <p className="text-sm text-gray-500">
                    You currently have Silver membership. Upgrade to Gold for chatbot access.
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen flex flex-col">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: "85vh" }}>
        <header className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">RV Placements Assistant</h1>
              <p className="text-sm opacity-90 mt-1">Ask about companies, packages, roles, departments, or placement trends</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Online</span>
            </div>
          </div>
        </header>

        <main ref={containerRef} className="flex-1 p-6 overflow-auto bg-gradient-to-b from-indigo-50/30 to-white">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.sender === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-2xl rounded-br-md shadow-md">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                        <div className="text-[10px] opacity-70 mt-1.5 text-right">
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-white border border-indigo-100 py-3 px-4 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="text-sm leading-relaxed">
                          {msg.loading ? (
                            <div className="flex items-center gap-2 text-indigo-600">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-xs italic">Searching placement records...</span>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold text-indigo-700">{children}</strong>,
                                  ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] opacity-60 mt-1.5 text-left">
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>

        <div className="px-4 py-2 bg-indigo-50/50 border-t border-indigo-100">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => sendMessage("What companies hire for software roles?")}
              className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors"
              disabled={isSending}
            >
              💼 Software companies
            </button>
            <button
              onClick={() => sendMessage("What is the average package?")}
              className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors"
              disabled={isSending}
            >
              💰 Average package
            </button>
            <button
              onClick={() => sendMessage("Which department has highest placements?")}
              className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition-colors"
              disabled={isSending}
            >
              📊 Top departments
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="px-4 py-4 bg-white border-t border-indigo-100 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder='Ask about placements... e.g. "Amazon placement details" or "CSE average package"'
            className="flex-1 rounded-xl border-2 border-indigo-100 px-4 py-3 focus:outline-none focus:border-indigo-400 transition-colors"
            disabled={isSending}
          />
          <button 
            type="submit" 
            disabled={isSending || !input.trim()} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}