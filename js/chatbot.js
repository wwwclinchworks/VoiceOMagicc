(function () {
  "use strict";

  const CONFIG = window.VOM_AI_CONFIG || {};
  const KNOWLEDGE_URL = "data/knowledge.json";
  let knowledge = null;
  let isOpen = false;
  let isBusy = false;
  let history = [];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function currentDark() {
    return document.documentElement.classList.contains("dark") ||
           document.body.classList.contains("dark");
  }

  function render() {
    const root = document.createElement("div");
    root.className = "vom-ai-root" + (currentDark() ? " vom-ai-dark" : "");
    root.innerHTML = `
      <button class="vom-ai-launcher" id="vomAiLauncher" aria-label="Open Voice-O-Magic AI Study Coach" title="AI Study Coach">
        <img src="logo.jpg" alt="Voice-O-Magic">
        <span class="vom-ai-launcher-badge"></span>
      </button>

      <section class="vom-ai-card" id="vomAiCard" aria-label="Voice-O-Magic AI Study Coach">
        <header class="vom-ai-header">
          <img class="vom-ai-header-logo" src="logo.jpg" alt="Voice-O-Magic">
          <div>
            <div class="vom-ai-title">Voice-O-Magic AI Coach</div>
            <div class="vom-ai-subtitle">Public speaking study assistant</div>
          </div>
          <div class="vom-ai-header-actions">
            <button class="vom-ai-icon-btn" id="vomAiClear" title="Clear conversation" aria-label="Clear conversation">↺</button>
            <button class="vom-ai-icon-btn" id="vomAiClose" title="Close" aria-label="Close chatbot">×</button>
          </div>
        </header>

        <div class="vom-ai-body" id="vomAiMessages">
          <div class="vom-ai-welcome">
            <h4>Learn. Practice. Speak better.</h4>
            <p>I can help you study public speaking using the Voice-O-Magic study material. Ask for explanations, summaries, examples, or practice questions.</p>
            <div class="vom-ai-chips">
              <button class="vom-ai-chip" data-prompt="Explain public speaking in simple words.">Explain a topic</button>
              <button class="vom-ai-chip" data-prompt="Give me 5 practice questions from the study material.">Practice questions</button>
              <button class="vom-ai-chip" data-prompt="Explain voice modulation with an example.">Voice modulation</button>
              <button class="vom-ai-chip" data-prompt="How can I improve my body language while speaking?">Body language</button>
            </div>
          </div>
        </div>

        <footer class="vom-ai-footer">
          <div class="vom-ai-input-row">
            <textarea id="vomAiInput" class="vom-ai-textarea" rows="1" placeholder="Ask about public speaking..." aria-label="Ask the AI"></textarea>
            <button id="vomAiSend" class="vom-ai-send" aria-label="Send message" title="Send">➤</button>
          </div>
          <div class="vom-ai-disclaimer">AI answers are for study support. Use the provided material as the primary source.</div>
        </footer>
      </section>
    `;
    document.body.appendChild(root);

    const launcher = root.querySelector("#vomAiLauncher");
    const card = root.querySelector("#vomAiCard");
    const close = root.querySelector("#vomAiClose");
    const clear = root.querySelector("#vomAiClear");
    const input = root.querySelector("#vomAiInput");
    const send = root.querySelector("#vomAiSend");
    const messages = root.querySelector("#vomAiMessages");

    launcher.addEventListener("click", () => {
      isOpen = !isOpen;
      card.classList.toggle("open", isOpen);
      if (isOpen) setTimeout(() => input.focus(), 100);
    });
    close.addEventListener("click", () => {
      isOpen = false;
      card.classList.remove("open");
    });
    clear.addEventListener("click", () => {
      history = [];
      messages.innerHTML = `
        <div class="vom-ai-welcome">
          <h4>Conversation cleared.</h4>
          <p>Ask another public-speaking study question whenever you're ready.</p>
        </div>`;
    });

    root.querySelectorAll(".vom-ai-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.prompt;
        sendMessage();
      });
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    send.addEventListener("click", sendMessage);

    window.addEventListener("vom-theme-changed", () => {
      root.classList.toggle("vom-ai-dark", currentDark());
    });

    async function sendMessage() {
      const text = input.value.trim();
      if (!text || isBusy) return;
      // The API key is intentionally NOT kept in the browser.
      // Requests go through the Vercel serverless function at /api/chat.

      input.value = "";
      input.style.height = "auto";
      addMessage("user", text);
      history.push({ role: "user", content: text });
      isBusy = true;
      send.disabled = true;
      const typing = addTyping();

      try {
        if (!knowledge) {
          const response = await fetch(KNOWLEDGE_URL, { cache: "no-store" });
          if (!response.ok) throw new Error("Could not load study material.");
          knowledge = await response.json();
        }

        const context = retrieveKnowledge(text, knowledge);
        const systemPrompt = buildSystemPrompt(context);
        const messagesForApi = [
          { role: "system", content: systemPrompt },
          ...history.slice(-10)
        ];

        const apiResponse = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: CONFIG.MODEL || "openrouter/free",
            messages: messagesForApi
          })
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text();
          throw new Error("OpenRouter request failed (" + apiResponse.status + "). " + errText.slice(0, 180));
        }

        const data = await apiResponse.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (!answer) throw new Error("The model returned an empty response.");

        typing.remove();
        addMessage("assistant", answer);
        history.push({ role: "assistant", content: answer });
      } catch (err) {
        typing.remove();
        addMessage("assistant", "I couldn't complete that request right now. Please check the OpenRouter key, model availability, internet connection, or free-model limits.\n\nTechnical detail: " + err.message);
      } finally {
        isBusy = false;
        send.disabled = false;
        input.focus();
      }
    }
  }

  function retrieveKnowledge(query, data) {
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const topics = Array.isArray(data?.topics) ? data.topics : [];
    const scored = topics.map(topic => {
      const haystack = [
        topic.title || "",
        ...(topic.keywords || []),
        topic.content || ""
      ].join(" ").toLowerCase();
      let score = 0;
      terms.forEach(t => {
        if (haystack.includes(t)) score += 1;
        if ((topic.keywords || []).some(k => k.toLowerCase().includes(t))) score += 2;
      });
      return { topic, score };
    }).sort((a,b) => b.score - a.score);

    const selected = scored.filter(x => x.score > 0).slice(0, 2);
    if (!selected.length) return [];
    return selected.map(x => x.topic);
  }

  function buildSystemPrompt(topics) {
    const context = topics.length
      ? topics.map(t => `### ${t.title}\n${t.content}`).join("\n\n")
      : "No directly relevant study material was found for this question.";

    return `You are the Voice-O-Magic AI Study Coach.

SCOPE:
- Your subject is PUBLIC SPEAKING and communication learning.
- Help the user study, understand, revise, practice, and apply public-speaking concepts.
- Do not act as a general-purpose AI assistant.

KNOWLEDGE RULE:
- Use the supplied Voice-O-Magic study material as your primary source.
- Stay focused on the material relevant to the user's question.
- Do not invent facts and present them as if they came from Voice-O-Magic.
- If the requested information is not available in the supplied study material, clearly say so.
- You may provide a brief general explanation only when useful, and clearly label it as general guidance.

OFF-TOPIC RULE:
If the user asks about programming, cybersecurity, politics, finance, medicine, celebrity gossip, or another unrelated subject, politely explain that you specialize in public-speaking study.

STYLE:
- Keep answers concise and useful.
- Prefer short paragraphs and bullet points.
- Avoid unnecessary explanations.
- Give a simple example when useful.
- For study questions, focus on helping the student learn.
- Do not overwhelm the user with information.
- Normally answer in 2-5 short paragraphs or bullet points.

SUPPLIED STUDY MATERIAL:
${context}`;
  }

  function addMessage(role, text) {
    const box = document.querySelector("#vomAiMessages");
    if (!box) return;
    const row = document.createElement("div");
    row.className = "vom-ai-msg " + role;
    const bubble = document.createElement("div");
    bubble.className = "vom-ai-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }

  function addTyping() {
    const box = document.querySelector("#vomAiMessages");
    const row = document.createElement("div");
    row.className = "vom-ai-msg assistant";
    row.innerHTML = `<div class="vom-ai-bubble"><span class="vom-ai-typing"><span class="vom-ai-dot"></span><span class="vom-ai-dot"></span><span class="vom-ai-dot"></span></span></div>`;
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
    return row;
  }

  function syncTheme() {
    const root = document.querySelector(".vom-ai-root");
    if (root) root.classList.toggle("vom-ai-dark", currentDark());
  }

  window.addEventListener("load", () => {
    render();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
})();
