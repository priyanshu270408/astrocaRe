import nodemailer from "nodemailer";

function configured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!configured()) {
    console.warn(`[email skipped] SMTP is not configured. Would send: ${subject} -> ${to}`);
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html });
  return true;
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  const safeName = name.replace(/[<>&"']/g, "");
  await sendEmail(email, "Welcome to ASTROCARE Mission Control", `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#241533">
      <h2>Welcome to ASTROCARE, ${safeName}!</h2>
      <p>Your engineer account has been created successfully.</p>
      <p>You can now sign in to Mission Control, select an astronaut, enter health readings and review alerts.</p>
      <p style="color:#6b5b7d">ASTROCARE · Predict early. Respond faster.</p>
    </div>`);
}

export async function sendAlertEmail(alert: { astronautId: string; severity: string; message: string; suggestion: string }): Promise<void> {
  const to = process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return;
  await sendEmail(to, `[ASTROCARE ${alert.severity}] ${alert.astronautId}`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#241533">
      <h2>ASTROCARE health alert</h2><p><b>Astronaut:</b> ${alert.astronautId}</p>
      <p><b>Severity:</b> ${alert.severity}</p><p>${alert.message}</p>
      <h3>Suggested next step</h3><p>${alert.suggestion}</p>
      <p style="color:#9b4b4b">Decision support only. Follow mission-approved medical procedures.</p>
    </div>`);
}
