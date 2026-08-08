/*
 * Voice-O-Magic AI configuration
 *
 * The OpenRouter secret is NOT stored in this browser file.
 * Put OPENROUTER_API_KEY in Vercel Project Settings -> Environment Variables.
 * The browser calls /api/chat, which securely reads the server-side variable.
 */
window.VOM_AI_CONFIG = {
  MODEL: "openrouter/free",
  SITE_URL: window.location.origin,
  SITE_NAME: "Voice-O-Magic"
};
