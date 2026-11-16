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

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

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

function getBrevoApiUrl(): string {
  const testApiUrl = process.env.BREVO_TEST_API_URL;
  if (!testApiUrl) {
    return BREVO_API_URL;
  }

  try {
    const databaseUrl = new URL(process.env.TEST_DATABASE_URL ?? "");
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
    const apiUrl = new URL(testApiUrl);

    if (
      !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
      !LOCAL_HOSTS.has(databaseUrl.hostname) ||
      !/^agricultor_test(?:_|$)/.test(databaseName) ||
      apiUrl.protocol !== "http:" ||
      !LOCAL_HOSTS.has(apiUrl.hostname) ||
      apiUrl.username ||
      apiUrl.password ||
      apiUrl.pathname !== "/v3/smtp/email" ||
      apiUrl.search
    ) {
      throw new Error();
    }

    return apiUrl.toString();
  } catch {
    throw new Error(
      "BREVO_TEST_API_URL solo se permite con un TEST_DATABASE_URL local y desechable.",
    );
  }
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
    getBrevoApiUrl(),
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
