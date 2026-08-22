"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { siteConfig } from "@/lib/site";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isCrisis?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm here to support you. I'm Dr. CBJ's AI wellness assistant. How are you feeling today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `anon_${Date.now()}`);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
  const container = messagesContainerRef.current;
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });
};

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

   async function handleSubmit(e: React.FormEvent) {
     console.log("[CHAT_SUBMIT] Form submission started");
     e.preventDefault();
     
     if (!input.trim()) {
       console.log("[CHAT_SUBMIT] Empty input - ignoring");
       return;
     }
     if (loading) {
       console.log("[CHAT_SUBMIT] Already loading - ignoring duplicate submit");
       return;
     }
     
     console.log("[CHAT_SUBMIT] Valid submission, input length:", input.trim().length);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    console.log("[CHAT_SUBMIT] Adding user message to state");
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      console.log("[CHAT_SUBMIT] Fetching /api/chat...");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          isAnonymous: true,
        }),
      });

      console.log("[CHAT_SUBMIT] API response received, status:", res.status);
      console.log("[CHAT_SUBMIT] Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log("[CHAT_SUBMIT] JSON parsed successfully, isCrisis:", data.isCrisis);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        isCrisis: data.isCrisis,
      };

      console.log("[CHAT_SUBMIT] Adding assistant message to state");
      setMessages((prev) => [...prev, assistantMessage]);
      console.log("[CHAT_SUBMIT] Session ID used:", sessionId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[CHAT_SUBMIT] Fetch failed:", errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      console.log("[CHAT_SUBMIT] Loading complete, setLoading(false)");
    }
  }

  return (
    <div className="py-4 sm:py-8 flex flex-col min-h-[calc(100vh-180px)]">
      <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 w-full flex flex-col">
        <div className="mb-4 text-center sm:mb-8 shrink-0">
          <h1 className="section-title">AI Wellness Assistant</h1>
          <p className="text-gray-600">
            A supportive space for general mental wellness discussions.
            <br className="hidden sm:block" />
            <span className="text-sm text-gray-500">
              Note: This assistant does not diagnose or prescribe. For
              personalised care, please book an appointment with Dr. CBJ.
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-3xl flex flex-col shrink-0" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <div className="flex items-center gap-3 bg-teal-900 p-3 text-white sm:p-4 shrink-0">
            <Image
              src="/assets/avatar.png"
              alt={siteConfig.doctorName}
              width={48}
              height={48}
              className="rounded-full object-cover shrink-0"
            />
            <div>
              <p className="font-semibold">{siteConfig.doctorName}</p>
              <p className="text-xs text-teal-200">AI Wellness Assistant</p>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-6"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex min-w-0 items-start gap-2 sm:gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Image
                    src="/assets/avatar.png"
                    alt={siteConfig.doctorName}
                    width={32}
                    height={32}
                    className="rounded-full object-cover shrink-0"
                  />
                )}
                <div
                  className={`min-w-0 max-w-[85%] break-words rounded-2xl px-3 py-3 text-sm shadow-sm sm:max-w-[72%] sm:px-4 ${
                    message.role === "user"
                      ? "bg-teal-600 text-white"
                      : message.isCrisis
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-teal-50/70 text-gray-800 border border-teal-100"
                  }`}
                >
                  <div className="leading-relaxed">
  {message.role === "assistant" ? (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-5 list-disc space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-5 list-decimal space-y-1">
            {children}
          </ol>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-teal-900">
            {children}
          </strong>
        ),
      }}
    >
      {message.content}
    </ReactMarkdown>
  ) : (
    <span className="whitespace-pre-wrap">
      {message.content}
    </span>
  )}
</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <Image
                  src="/assets/avatar.png"
                  alt={siteConfig.doctorName}
                  width={32}
                  height={32}
                  className="rounded-full object-cover shrink-0"
                />
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-teal-100 bg-white/95 p-3 backdrop-blur-sm sm:p-4 shrink-0">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                disabled={loading}
                className="input-field min-w-0 !rounded-full !border-teal-200 !bg-teal-50/40 !px-4 !py-3 sm:!px-5"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary !px-4 !py-3 disabled:opacity-50 sm:!px-5"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2">
              If you are in immediate danger in Jamaica, call 119 or 110, or
              go to the nearest emergency room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
