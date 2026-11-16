type PasswordResetEmail = {
  email: string;
  name: string;
  url: string;
};

type BrevoEmailDependencies = {
  apiKey?: string;
  senderEmail?: string;
  fetcher?: typeof fetch;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendPasswordResetEmail(
  { email, name, url }: PasswordResetEmail,
  dependencies: BrevoEmailDependencies = {},
): Promise<void> {
  const apiKey = dependencies.apiKey ?? process.env.API_KEY_BREVO;
  const senderEmail = dependencies.senderEmail ?? process.env.BREVO_SENDER_EMAIL;

  if (!apiKey) {
    throw new Error("API_KEY_BREVO debe estar configurada para enviar correos.");
  }
  if (!senderEmail) {
    throw new Error(
      "BREVO_SENDER_EMAIL debe estar configurada para enviar correos.",
    );
  }

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  const response = await (dependencies.fetcher ?? fetch)(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        sender: { email: senderEmail, name: "Agricultor" },
        to: [{ email }],
        subject: "Recupera tu contraseña de Agricultor",
        htmlContent: `<p>Hola ${safeName},</p><p>Recibimos una solicitud para cambiar la contraseña de tu cuenta de Agricultor. Usa este enlace dentro de una hora:</p><p><a href="${safeUrl}">Cambiar contraseña</a></p><p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>`,
        textContent: `Hola ${name},\n\nRecibimos una solicitud para cambiar la contraseña de tu cuenta de Agricultor. Usa este enlace dentro de una hora:\n${url}\n\nSi no solicitaste este cambio, puedes ignorar este mensaje.`,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Brevo rechazó el correo de recuperación (HTTP ${response.status}).`);
  }
}
