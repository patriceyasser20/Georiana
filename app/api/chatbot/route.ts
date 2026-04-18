import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: "Please type a message." });
    }

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        reply: "Grok API key is not configured. Please check .env.local" 
      });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.20-reasoning",                    // ← Fixed model name
        messages: [
          {
            role: "system",
            content: `You are a friendly, professional customer service assistant for Georgiana, a modern women's fashion store in Egypt.

Key information:
- Shipping: Currently only to Egypt, 3-7 business days
- Returns: Accepted within 14 days (unused items with tags)
- Promo codes: SUMMER30 (30% off), FIRST20 (20% off first order)

Be polite, helpful, and clear.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API Error:", response.status, errorText);
      return NextResponse.json({ reply: "Sorry, I'm having trouble connecting right now." });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 
                 "Thank you for your message. How else can I help you?";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ 
      reply: "Sorry, I'm having trouble connecting right now. Please try again." 
    });
  }
}