export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  fetcher: typeof fetch = fetch
): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) throw new Error('Resend credentials are not configured');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(to)) {
    throw new Error('Invalid recipient email address');
  }

  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to: [to], subject, text })
  });
  if (!response.ok) throw new Error(`Resend API send failed (${response.status})`);

  const payload = await response.json() as { id?: unknown };
  if (typeof payload.id !== 'string') throw new Error('Resend response did not include a message id');
  return payload.id;
}
