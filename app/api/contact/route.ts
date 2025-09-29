export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = (body?.fullName || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const subject = (body?.subject || "").toString().trim();
    const message = (body?.message || "").toString().trim();

    if (!fullName || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "fullName, email, subject and message are required" },
        { status: 400 }
      );
    }

    // Basic email sanity check
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const EMAIL_HOST = process.env.EMAIL_HOST;
    const EMAIL_PORT = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
    const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";
    const EMAIL_TO = process.env.CONTACT_TO_EMAIL || EMAIL_USER; // default to sender inbox
    const EMAIL_FROM = EMAIL_USER; // avoid spoofing, use authenticated sender

    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: "Server email is not configured (missing EMAIL_USER/EMAIL_PASSWORD)" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport(
      EMAIL_HOST
        ? { host: EMAIL_HOST, port: EMAIL_PORT || 587, secure: EMAIL_SECURE, auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } }
        : ({ service: EMAIL_SERVICE, auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD } } as any)
    );

    const mailOptions = {
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `Contact Form: ${subject}`,
      text: message,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      `,
      replyTo: email,
    } as const;

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ ok: true, message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}