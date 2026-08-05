import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { order } = await req.json();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing order data.",
        },
        {
          status: 400,
        }
      );
    }

    const items = order.order_items || [];

    const itemsHtml = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding:15px 0;vertical-align:top;">
              <img
                src="${item.image_url}"
                alt="${item.product_name}"
                width="70"
                height="70"
                style="
                  border-radius:10px;
                  border:1px solid #eee;
                  object-fit:cover;
                "
              />
            </td>

            <td style="padding-left:15px;vertical-align:top;">
              <div
                style="
                  font-size:15px;
                  font-weight:bold;
                  color:#111;
                  margin-bottom:8px;
                "
              >
                ${item.product_name}
              </div>

              <div
                style="
                  color:#666;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Size: ${item.size}<br>
                Color: ${item.color}<br>
                Quantity: ${item.quantity}
              </div>
            </td>

            <td
              align="right"
              style="
                vertical-align:top;
                font-weight:bold;
                color:#111;
              "
            >
              EGP ${Number(item.price).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");
      const subtotal = Number(order.total || 0);
    const deliveryFee = Number(order.delivery_fee || 0);
    const discount = Number(order.discount_amount || 0);

    const grandTotal = subtotal + deliveryFee - discount;

    const appliedOffers =
    Array.isArray(order.applied_offers) && order.applied_offers.length > 0
        ? order.applied_offers
            .map((offer: any) => {
            if (typeof offer === "string") {
                return `<li>${offer}</li>`;
            }

            return `<li>${offer.name || offer.title || JSON.stringify(offer)}</li>`;
            })
            .join("")
        : "";

    const { data, error } = await resend.emails.send({
      from: "Georiana <orders@georiana.com>",
      to: order.user_email,
      subject: "🚚 Your Georiana order is on its way!",
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Order Shipped</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="background:#f5f5f5;padding:40px 0;"
>
<tr>
<td align="center">

<table
  width="650"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#ffffff;
    border-radius:18px;
    overflow:hidden;
  "
>

<!-- Logo -->
<tr>
<td align="center" style="padding:40px 30px 25px;">

<img
  src="https://qhtselljfzsavnltrhsh.supabase.co/storage/v1/object/public/product-images/logo.svg"
  alt="Georiana"
  width="220"
/>

</td>
</tr>

<!-- Header -->
<tr>
<td style="padding:0 40px;">

<h1
  style="
    margin:0;
    color:#111;
    font-size:28px;
  "
>
Your order is on its way!
</h1>

<p
  style="
    margin-top:20px;
    font-size:16px;
    color:#555;
    line-height:1.7;
  "
>
Hello,
</p>

<p
  style="
    color:#555;
    line-height:1.8;
    font-size:15px;
  "
>
Great news! Your order has been packed and shipped.
We're preparing it for delivery and we'll notify you again once it arrives.
</p>

</td>
</tr>

<!-- Order -->
<tr>
<td style="padding:30px 40px;">

<hr style="border:none;border-top:1px solid #eee;">

<h2
  style="
    margin-top:30px;
    color:#111;
  "
>
Order #${order.id}
</h2>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
>
${itemsHtml}
</table>

<hr
style="
margin:30px 0;
border:none;
border-top:1px solid #eee;
">

<table width="100%" cellpadding="6">

<tr>
<td>Products</td>

<td align="right">
EGP ${subtotal.toFixed(2)}
</td>
</tr>

${
discount > 0
? `
<tr>
<td style="color:#16a34a;">
Discount</td>

<td
align="right"
style="color:#16a34a;font-weight:bold;"
>
- EGP ${discount.toFixed(2)}
</td>
</tr>
`
: ""
}

<tr>
<td>Delivery Fee</td>

<td align="right">
EGP ${deliveryFee.toFixed(2)}
</td>
</tr>

<tr>
<td>Payment Method</td>

<td align="right">
${order.payment_method}
</td>
</tr>

<tr>
<td>Order Date</td>

<td align="right">
${new Date(order.created_at).toLocaleDateString("en-GB")}
</td>
</tr>

${
order.promo_code
? `
<tr>
<td>Promo Code</td>

<td
align="right"
style="
font-weight:bold;
color:#16a34a;
"
>
${order.promo_code}
</td>
</tr>
`
: ""
}

</table>

${
appliedOffers
? `
<hr style="margin:25px 0;border:none;border-top:1px solid #eee;">

<h3 style="margin-bottom:12px;">
Applied Offers
</h3>

<ul
style="
margin:0;
padding-left:20px;
color:#555;
line-height:1.8;
"
>
${appliedOffers}
</ul>
`
: ""
}

<hr style="margin:30px 0;border:none;border-top:1px solid #eee;">

<table width="100%">
<tr>

<td
style="
font-size:24px;
font-weight:bold;
"
>
Grand Total
</td>

<td
align="right"
style="
font-size:24px;
font-weight:bold;
"
>
EGP ${grandTotal.toFixed(2)}
</td>

</tr>
</table>

<hr
style="
margin:30px 0;
border:none;
border-top:1px solid #eee;
">

<h3
style="
margin-bottom:10px;
color:#111;
"
>
Shipping Address
</h3>

<p
style="
color:#555;
line-height:1.8;
margin:0;
"
>
${order.street}<br>
Apartment ${order.apartment}<br>
${order.city}<br>
${order.governorate}
</p>

<div
style="
text-align:center;
margin-top:45px;
"
>

<a
href="https://georiana.com"
style="
background:#000;
color:#fff;
text-decoration:none;
padding:16px 36px;
display:inline-block;
border-radius:999px;
font-weight:bold;
"
>
Visit Georiana
</a>

</div>

</td>
</tr>

<!-- Footer -->
<tr>
<td
style="
background:#fafafa;
padding:30px;
text-align:center;
font-size:13px;
color:#777;
"
>

Thank you for shopping with <strong>Georiana</strong> ❤️

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
    });

    if (error) {
      console.error("Resend Error:", error);

      return NextResponse.json(
        {
          success: false,
          error,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      {
        status: 500,
      }
    );
  }
}