"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


export async function sendWelcomeEmail({ fullname, email, password }) {
    const { error } = await resend.emails.send({
        from: "Elite Padel <noreply@whxismou.dev>",
        to: email,
        subject: "¡Bienvenido/a a Elite Padel! 🎾",
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
</head>

<body style="margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;">

<!-- HEADER -->
<tr>
<td style="background:#0f172a;padding:36px;text-align:center;">

<table align="center" cellpadding="0" cellspacing="0">
<tr>

<td style="padding-right:10px;">
<div style="background:#13ec5b;border-radius:12px;width:42px;height:42px;text-align:center;line-height:42px;font-weight:900;color:#0f172a;">
EP
</div>
</td>

<td style="font-size:22px;font-weight:800;color:white;">
Elite<span style="color:#13ec5b;">Padel</span>
</td>

</tr>
</table>

</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:36px 40px;">

<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">
¡Bienvenido/a, ${fullname}! 🎾
</h1>

<p style="margin:0 0 20px;color:#475569;font-size:15px;">
Tu cuenta en Elite Padel ha sido creada. Aquí tienes tus credenciales:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">

<tr>
<td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#94a3b8;font-weight:600;">
EMAIL
</td>

<td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:700;color:#0f172a;">
${email}
</td>
</tr>

<tr>
<td style="padding:14px 18px;font-size:12px;color:#94a3b8;font-weight:600;">
CONTRASEÑA
</td>

<td style="padding:14px 18px;font-family:monospace;font-weight:700;color:#0f172a;">
${password}
</td>
</tr>

</table>

<p style="margin-top:20px;color:#475569;font-size:14px;">
Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
</p>

<table cellpadding="0" cellspacing="0" align="center" style="margin-top:24px;">
<tr>
<td align="center" bgcolor="#13ec5b" style="border-radius:999px;">
<a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://elite-padel.vercel.app/"}"
style="display:inline-block;padding:14px 28px;font-weight:700;color:#0f172a;text-decoration:none;">
Iniciar sesión →
</a>
</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
Elite Padel · Si no esperabas este correo, ignóralo.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`,
    });

    if (error) {
        console.error("[Resend] Error sending welcome email:", error);
        return { ok: false, error: error.message };
    }
    return { ok: true };
}
