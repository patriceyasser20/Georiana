import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!order || !order.user_email) {
      return NextResponse.json({ success: false, message: "Missing order data" });
    }

    const orderItems = order.order_items || [];

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://ilzijypghlyourydqhvt.supabase.co/storage/v1/object/public/product-images/logo.svg" alt="GEORIANA" style="height: 75px; max-width: 100%;" />
        </div>
        
        <h2 style="color: #000; text-align: center;">Thank you for your order at Georiana!</h2>
        
        <p style="font-size: 16px;"><strong>Order Number:</strong> #${order.id ? order.id.slice(0, 8) : 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at || Date.now()).toLocaleString()}</p>
        
        <h3 style="margin-top: 30px;">Items:</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
          ${orderItems.map((item: any) => `
            <li>${item.product_name || item.name} × ${item.quantity || 1} — EGP ${item.price || 0}</li>
          `).join('')}
        </ul>
        
        <p style="font-size: 18px; margin-top: 30px;">
          <strong>Total: EGP ${order.total || 0}</strong>
        </p>
        
        <p>Your order will be shipped within 3-7 business days.</p>
        
        <p style="margin-top: 40px; color: #555; font-size: 14px;">
          Thank you for shopping with us ❤️<br>
          The Georiana Team
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'Georgiana <onboarding@resend.dev>',
      to: 'patriceyasser20@gmail.com',
      subject: `Order Confirmation #${order.id ? order.id.slice(0, 8) : 'N/A'}`,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", result);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Resend Error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}