export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured on Vercel." });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const model = typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : "openrouter/free";

    if (!messages.length) {
      return res.status(400).json({ error: "Messages are required." });
    }

    // Keep this endpoint constrained to chat requests from this site.
    // The browser cannot supply an OpenRouter API key or arbitrary headers.
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://voice-o-magicc.vercel.app",
        "X-Title": "Voice-O-Magic"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 500) };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || "OpenRouter request failed."
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unable to reach OpenRouter.",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
