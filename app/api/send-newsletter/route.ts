import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  return !!token && !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
}

function unsubscribeToken(email: string) {
  return crypto
    .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!)
    .update(email.toLowerCase())
    .digest('hex');
}

function buildEmailHtml({
  headline,
  bodyText,
  imageUrl,
  ctaText,
  ctaLink,
  email,
}: {
  headline: string;
  bodyText: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  email: string;
}) {
  const token = unsubscribeToken(email);
  const unsubUrl = `https://georiana.com/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Georiana</title></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;"><tr><td align="center"><table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td align="center" style="padding:40px 30px 25px;"><img src="https://qhtselljfzsavnltrhsh.supabase.co/storage/v1/object/public/product-images/logo.svg" alt="Georiana" width="220" /></td></tr>${imageUrl ? `<tr><td><img src="${imageUrl}" alt="" width="650" style="display:block;width:100%;height:auto;" /></td></tr>` : ''}<tr><td style="padding:30px 40px 0;"><h1 style="margin:0;color:#111;font-size:26px;text-align:center;">${headline}</h1><p style="color:#555;line-height:1.8;font-size:15px;text-align:center;white-space:pre-line;margin-top:20px;">${bodyText}</p></td></tr>${ctaText && ctaLink ? `<tr><td align="center" style="padding:20px 40px 10px;"><a href="${ctaLink}" style="background:#000;color:#fff;text-decoration:none;padding:16px 48px;display:inline-block;border-radius:999px;font-weight:bold;font-size:15px;">${ctaText}</a></td></tr>` : ''}<tr><td style="padding:30px 40px 0;"><hr style="border:none;border-top:1px solid #eee;"></td></tr><tr><td style="background:#fafafa;padding:30px;text-align:center;font-size:12px;color:#999;">Thank you for shopping with <strong>Georiana</strong> ❤️<br><br>You're receiving this because you have an account with Georiana.<br><a href="${unsubUrl}" style="color:#999;">Unsubscribe from marketing emails</a></td></tr></table></td></tr></table></body></html>`;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, headline, bodyText, imageUrl, ctaText, ctaLink, testEmail } = await req.json();

    if (!subject?.trim() || !headline?.trim() || !bodyText?.trim()) {
      return NextResponse.json({ error: 'Subject, headline, and body are required' }, { status: 400 });
    }

    // ── Test send — single recipient, skips the subscriber list entirely ──
    if (testEmail) {
      const { error } = await resend.emails.send({
        from: 'Georiana <news@georiana.com>',
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html: buildEmailHtml({ headline, bodyText, imageUrl, ctaText, ctaLink, email: testEmail }),
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ sent: 1, failed: 0, total: 1, test: true });
    }

    // ── Real send — fetch subscribed users ──
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .not('email', 'is', null)
      .eq('marketing_opt_out', false);

    if (fetchError) throw fetchError;

    const emails = [...new Set((profiles || []).map((p: any) => p.email).filter(Boolean))];

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No subscribed users found' }, { status: 400 });
    }

    // Resend's rate limit means we can't fire all of these in parallel at
    // once for large lists — chunk with a short pause between batches.
    const CHUNK_SIZE = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      chunks.push(emails.slice(i, i + CHUNK_SIZE));
    }

    let sent = 0;
    let failed = 0;

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((email) =>
          resend.emails.send({
            from: 'Georiana <news@georiana.com>',
            to: email,
            subject,
            html: buildEmailHtml({ headline, bodyText, imageUrl, ctaText, ctaLink, email }),
          })
        )
      );
      results.forEach((r) => (r.status === 'fulfilled' ? sent++ : failed++));
      await new Promise((res) => setTimeout(res, 1200));
    }

    return NextResponse.json({ sent, failed, total: emails.length });
  } catch (err: any) {
    console.error('[send-newsletter]', err);
    return NextResponse.json({ error: err.message || 'Failed to send' }, { status: 500 });
  }
}