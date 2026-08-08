export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY is not configured on Vercel."
    });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      return res.status(400).json({
        error: "Messages are required."
      });
    }

    // Basic request limits. The browser does not need huge prompts/history.
    if (messages.length > 12) {
      return res.status(400).json({
        error: "Conversation is too long. Please start a new chat."
      });
    }

    const safeMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "system" ||
            message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 6000)
      }));

    if (!safeMessages.length) {
      return res.status(400).json({
        error: "Valid messages are required."
      });
    }

    // Always use OpenRouter's free router.
    // Do not let the browser select a paid/arbitrary model.
    const model = "openrouter/free";

    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "voice-o-magicc.vercel.app";
    const siteUrl = `${forwardedProto}://${host}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": siteUrl,
          "X-Title": "Voice-O-Magic"
        },
        body: JSON.stringify({
          model,
          messages: safeMessages,
          temperature: 0.3,
          max_tokens: 300
        })
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text.slice(0, 500)
      };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error ||
          "OpenRouter request failed."
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Voice-O-Magic OpenRouter error:", error);

    return res.status(500).json({
      error: "Unable to reach OpenRouter."
    });
  }
}
