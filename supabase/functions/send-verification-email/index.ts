import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  try {
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log("Sending verification email to:", user.email);
    console.log("Action type:", email_action_type);

    // Determine language based on redirect_to or default to Dutch
    const isEnglish = redirect_to?.includes("lang=en") || false;
    
    // Check if this is a password recovery email
    const isPasswordRecovery = email_action_type === "recovery";
    
    // Generate verification link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const verificationLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Email content based on language and action type
    let content;
    
    if (isPasswordRecovery) {
      content = isEnglish ? {
        subject: "Reset your password - Bite Buddy",
        title: "Reset your password 🔐",
        subtitle: "You requested a password reset",
        body: "Click the button below to set a new password for your account. After clicking, you'll be taken to a page where you can enter your new password.",
        instructions: [
          "1. Click the button below",
          "2. You'll be redirected to the password reset page",
          "3. Enter your new password (minimum 6 characters)",
          "4. Confirm your new password",
          "5. Click 'Save password' to complete the reset"
        ],
        buttonText: "Reset Password",
        orText: "Or copy and paste this link in your browser:",
        footer: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
        team: "The Bite Buddy Team"
      } : {
        subject: "Wachtwoord resetten - Bite Buddy",
        title: "Wachtwoord resetten 🔐",
        subtitle: "Je hebt een wachtwoord reset aangevraagd",
        body: "Klik op de onderstaande knop om een nieuw wachtwoord in te stellen voor je account. Na het klikken word je doorgestuurd naar een pagina waar je je nieuwe wachtwoord kunt invoeren.",
        instructions: [
          "1. Klik op de onderstaande knop",
          "2. Je wordt doorgestuurd naar de wachtwoord reset pagina",
          "3. Voer je nieuwe wachtwoord in (minimaal 6 tekens)",
          "4. Bevestig je nieuwe wachtwoord",
          "5. Klik op 'Wachtwoord opslaan' om de reset te voltooien"
        ],
        buttonText: "Wachtwoord Resetten",
        orText: "Of kopieer en plak deze link in je browser:",
        footer: "Als je geen wachtwoord reset hebt aangevraagd, kun je deze e-mail veilig negeren. Je wachtwoord blijft ongewijzigd.",
        team: "Het Bite Buddy Team"
      };
    } else {
      content = isEnglish ? {
        subject: "Verify your email - Bite Buddy",
        title: "Welcome to Bite Buddy! 🍽️",
        subtitle: "You're almost there!",
        body: "Thanks for signing up. Please verify your email address by clicking the button below.",
        instructions: null,
        buttonText: "Verify Email Address",
        orText: "Or copy and paste this link in your browser:",
        footer: "If you didn't create an account with Bite Buddy, you can safely ignore this email.",
        team: "The Bite Buddy Team"
      } : {
        subject: "Bevestig je e-mailadres - Bite Buddy",
        title: "Welkom bij Bite Buddy! 🍽️",
        subtitle: "Je bent er bijna!",
        body: "Bedankt voor je registratie. Bevestig je e-mailadres door op de onderstaande knop te klikken.",
        instructions: null,
        buttonText: "E-mailadres Bevestigen",
        orText: "Of kopieer en plak deze link in je browser:",
        footer: "Als je geen account hebt aangemaakt bij Bite Buddy, kun je deze e-mail veilig negeren.",
        team: "Het Bite Buddy Team"
      };
    }

    // Generate instructions HTML if applicable
    const instructionsHtml = content.instructions ? `
      <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #065f46;">
          ${isEnglish ? "How to reset your password:" : "Zo reset je je wachtwoord:"}
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #065f46;">
          ${content.instructions.map((step: string) => `<li>${step}</li>`).join("")}
        </ul>
      </div>
    ` : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff;">
                🍽️ Bite Buddy
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: bold; color: #18181b;">
                ${content.title}
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; color: #71717a;">
                ${content.subtitle}
              </p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                ${content.body}
              </p>
              
              ${instructionsHtml}
              
              <!-- Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                      ${content.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 32px 0 8px; font-size: 14px; color: #71717a;">
                ${content.orText}
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f4f4f5; border-radius: 8px; font-size: 12px; word-break: break-all; color: #3f3f46;">
                ${verificationLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; text-align: center;">
                ${content.footer}
              </p>
              <p style="margin: 0; font-size: 14px; color: #a1a1aa; text-align: center;">
                ${content.team}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: "Bite Buddy <onboarding@resend.dev>",
      to: [user.email],
      subject: content.subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Verification email sent successfully to:", user.email);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || "Failed to send email",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
