'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';

type Message = {
  id: number;
  text: string;
  isBot: boolean;
};

export default function CustomerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Hello! 👋 I'm Georgiana's AI assistant. How can I help you today?", 
      isBot: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    getUser();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOrder = async (orderNumber: string) => {
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          size,
          color,
          quantity,
          price,
          image_url
        )
      `)
      .eq('id', orderNumber)
      .single();

    if (error || !data) return null;
    return data;
  };

  const getNaturalReply = async (text: string): Promise<string> => {
    const lower = text.toLowerCase().trim();

    // Order tracking
    if (lower.includes("track") || lower.includes("order") || lower.includes("status") || lower.includes("where is")) {
      if (userEmail) {
        return "I can check your orders for you. Would you like me to show your recent orders?";
      }
      return "Sure! Please provide your order number (e.g. 2177022f) so I can look it up for you.";
    }

    // If user provides order number
    const orderMatch = text.match(/([a-f0-9]{8,})/i);
    if (orderMatch) {
      const orderNumber = orderMatch[0];
      const order = await fetchOrder(orderNumber);

      if (order) {
        let response = `✅ Order #${order.id.slice(0,8)}...\n\n`;
        response += `Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
        response += `Status: ${order.status || 'Pending'}\n`;
        response += `Total: EGP ${order.total}\n\n`;
        response += `Shipping Address:\n${order.street || ''} ${order.apartment ? ', ' + order.apartment : ''}\n`;
        response += `${order.city || ''}, ${order.governorate || ''}\n\n`;
        response += "Items:\n";
        order.order_items?.forEach((item: any) => {
          response += `• ${item.product_name} (${item.size} • ${item.color}) x${item.quantity}\n`;
        });
        return response;
      }
      return "I couldn't find an order with that number. Could you double-check it?";
    }

    if (lower.includes("ship") || lower.includes("delivery")) {
      return "We currently ship only to Egypt. Standard delivery takes 3-7 business days via Aramex or local courier.";
    }

    if (lower.includes("return") || lower.includes("refund")) {
      return "Returns are accepted within 14 days of delivery. The item must be unused with original tags. Would you like the full return instructions?";
    }

    if (lower.includes("promo") || lower.includes("discount") || lower.includes("code")) {
      return "Current active promo codes:\n\n• SUMMER30 → 30% off sitewide\n• FIRST20 → 20% off your first order\n\nWould you like me to apply one?";
    }

    return "Thank you for your message! I can help with order tracking, shipping info, returns, promo codes, or anything else. What would you like to know?";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input.trim(), isBot: false };
    setMessages(prev => [...prev, userMsg]);

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const reply = await getNaturalReply(currentInput);

    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, isBot: true }]);
      setIsLoading(false);
    }, 700);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-25 right-8 bg-black text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all z-50"
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-8 w-96 bg-white rounded-3xl shadow-2xl flex flex-col max-h-[560px] z-50 border overflow-hidden">
          <div className="bg-black text-white p-4 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black font-bold text-xl">G</div>
              <div>
                <p className="font-semibold">Georgiana Assistant</p>
                <p className="text-xs text-green-400">● Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl ${msg.isBot ? 'bg-white border' : 'bg-black text-white'}`}>
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500 text-sm">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 border rounded-2xl px-5 py-3.5 focus:outline-none focus:border-black"
              />
              <button
                onClick={sendMessage}
                className="bg-black text-white px-6 rounded-2xl hover:bg-gray-800"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}