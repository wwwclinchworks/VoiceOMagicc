(function () {
  "use strict";

  const CONFIG = window.VOM_AI_CONFIG || {};
  const KNOWLEDGE_URL = "data/knowledge.json";

  let knowledge = null;
  let isOpen = false;
  let isBusy = false;
  let history = [];

  function currentDark() {
    return document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark");
  }

  function render() {
    if (document.querySelector(".vom-ai-root")) return;

    const root = document.createElement("div");
    root.className = "vom-ai-root" + (currentDark() ? " vom-ai-dark" : "");

    root.innerHTML = `
      <button
        class="vom-ai-launcher"
        id="vomAiLauncher"
        type="button"
        aria-label="Open Voice-O-Magic AI Study Coach"
        title="AI Study Coach"
      >
        <img src="logo.jpg" alt="Voice-O-Magic AI">
        <span class="vom-ai-launcher-badge" aria-hidden="true"></span>
      </button>

      <section
        class="vom-ai-card"
        id="vomAiCard"
        aria-label="Voice-O-Magic AI Study Coach"
        aria-hidden="true"
      >
        <header class="vom-ai-header">
          <img class="vom-ai-header-logo" src="logo.jpg" alt="Voice-O-Magic AI">

          <div class="vom-ai-header-text">
            <div class="vom-ai-title">Voice-O-Magic AI Coach</div>
            <div class="vom-ai-subtitle">Public speaking study assistant</div>
          </div>

          <div class="vom-ai-header-actions">
            <button
              class="vom-ai-icon-btn"
              id="vomAiClear"
              type="button"
              title="Clear conversation"
              aria-label="Clear conversation"
            >↺</button>

            <button
              class="vom-ai-icon-btn"
              id="vomAiClose"
              type="button"
              title="Minimize chatbot"
              aria-label="Minimize chatbot"
            >×</button>
          </div>
        </header>

        <div class="vom-ai-body" id="vomAiMessages" aria-live="polite">
          <div class="vom-ai-welcome">
            <h4>Learn. Practice. Speak better.</h4>
            <p>
              I can help you study public speaking using the Voice-O-Magic
              study material. Ask for explanations, summaries, examples,
              or practice questions.
            </p>

            <div class="vom-ai-chips">
              <button class="vom-ai-chip" type="button"
                data-prompt="Explain public speaking in simple words.">
                Explain a topic
              </button>

              <button class="vom-ai-chip" type="button"
                data-prompt="Give me 5 practice questions from the study material.">
                Practice questions
              </button>

              <button class="vom-ai-chip" type="button"
                data-prompt="Explain voice modulation with an example.">
                Voice modulation
              </button>

              <button class="vom-ai-chip" type="button"
                data-prompt="How can I improve my body language while speaking?">
                Body language
              </button>
            </div>
          </div>
        </div>

        <footer class="vom-ai-footer">
          <div class="vom-ai-input-row">
            <textarea
              id="vomAiInput"
              class="vom-ai-textarea"
              rows="1"
              placeholder="Ask about public speaking..."
              aria-label="Ask the AI"
              autocomplete="off"
              spellcheck="true"
            ></textarea>

            <button
              id="vomAiSend"
              class="vom-ai-send"
              type="button"
              aria-label="Send message"
              title="Send"
            >➤</button>
          </div>

          <div class="vom-ai-disclaimer">
            AI answers are for study support. Voice-O-Magic study material is the primary source.
          </div>
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

    function openChat() {
      isOpen = true;
      card.classList.add("open");
      card.setAttribute("aria-hidden", "false");
      launcher.setAttribute("aria-expanded", "true");

      window.setTimeout(() => {
        input.focus({ preventScroll: true });
        messages.scrollTop = messages.scrollHeight;
      }, 100);
    }

    function minimizeChat() {
      isOpen = false;
      card.classList.remove("open");
      card.setAttribute("aria-hidden", "true");
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus({ preventScroll: true });
    }

    launcher.setAttribute("aria-expanded", "false");
    launcher.addEventListener("click", () => {
      if (isOpen) {
        minimizeChat();
      } else {
        openChat();
      }
    });

    close.addEventListener("click", minimizeChat);

    clear.addEventListener("click", () => {
      history = [];
      messages.innerHTML = `
        <div class="vom-ai-welcome">
          <h4>Conversation cleared.</h4>
          <p>Ask another public-speaking study question whenever you're ready.</p>
        </div>`;
      input.focus();
    });

    root.querySelectorAll(".vom-ai-chip").forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.dataset.prompt || "";
        autoResizeInput();
        sendMessage();
      });
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    input.addEventListener("input", autoResizeInput);
    send.addEventListener("click", sendMessage);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) {
        minimizeChat();
      }
    });

    window.addEventListener("vom-theme-changed", () => {
      root.classList.toggle("vom-ai-dark", currentDark());
    });

    function autoResizeInput() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }

    async function sendMessage() {
      const text = input.value.trim();

      if (!text || isBusy) return;

      input.value = "";
      autoResizeInput();

      addMessage("user", text);
      history.push({ role: "user", content: text });

      isBusy = true;
      send.disabled = true;

      const typing = addTyping();

      try {
        if (!knowledge) {
          const response = await fetch(KNOWLEDGE_URL, {
            cache: "no-store"
          });

          if (!response.ok) {
            throw new Error("Could not load study material.");
          }

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
          const errorText = await apiResponse.text();
          throw new Error(
            "AI request failed (" +
            apiResponse.status +
            "). " +
            errorText.slice(0, 180)
          );
        }

        const data = await apiResponse.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();

        if (!answer) {
          throw new Error("The model returned an empty response.");
        }

        typing.remove();
        addMessage("assistant", answer);
        history.push({ role: "assistant", content: answer });
      } catch (error) {
        typing.remove();

        addMessage(
          "assistant",
          "I couldn't complete that request right now. Please check the AI service or try again."
        );

        console.error("Voice-O-Magic AI error:", error);
      } finally {
        isBusy = false;
        send.disabled = false;

        if (isOpen) {
          input.focus({ preventScroll: true });
        }
      }
    }
  }

  function retrieveKnowledge(query, data) {
    const terms = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2);

    const topics = Array.isArray(data?.topics) ? data.topics : [];

    const scored = topics
      .map((topic) => {
        const keywords = Array.isArray(topic.keywords)
          ? topic.keywords
          : [];

        const haystack = [
          topic.title || "",
          ...keywords,
          topic.content || ""
        ].join(" ").toLowerCase();

        let score = 0;

        terms.forEach((term) => {
          if (haystack.includes(term)) score += 1;

          if (
            keywords.some((keyword) =>
              String(keyword).toLowerCase().includes(term)
            )
          ) {
            score += 2;
          }
        });

        return { topic, score };
      })
      .sort((a, b) => b.score - a.score);

    const selected = scored
      .filter((item) => item.score > 0)
      .slice(0, 2);

    return selected.map((item) => item.topic);
  }

  function buildSystemPrompt(topics) {
    const context = topics.length
      ? topics
          .map((topic) => `### ${topic.title}\n${topic.content}`)
          .join("\n\n")
      : "No directly relevant study material was found for this question.";

    return `You are the Voice-O-Magic AI Study Coach.

SCOPE:
- Your subject is PUBLIC SPEAKING and communication learning.
- Help the user study, understand, revise, practice, and apply public-speaking concepts.
- Do not act as a general-purpose assistant.

KNOWLEDGE RULE:
- Use the supplied Voice-O-Magic study material as your primary source.
- Stay focused on the material relevant to the user's question.
- Do not invent facts and present them as if they came from Voice-O-Magic.
- If the requested information is not available in the supplied study material, clearly say so.
- You may provide brief general guidance only when useful, and clearly label it as general guidance.

OFF-TOPIC RULE:
If the user asks about programming, cybersecurity, politics, finance, medicine, celebrity gossip, or another unrelated subject, politely explain that you specialize in public-speaking study.

STYLE:
- Keep answers concise and useful.
- Prefer short paragraphs and bullet points.
- Use Markdown formatting for headings, bold text, and lists.
- Avoid unnecessary explanations.
- Give a simple example when useful.
- Normally answer in 2-5 short paragraphs or bullet points.
- Do not overwhelm the user with information.

SUPPLIED STUDY MATERIAL:
${context}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMarkdown(text) {
    let html = escapeHtml(text || "");

    // Fenced code blocks.
    html = html.replace(
      /```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g,
      '<pre class="vom-ai-code"><code>$1</code></pre>'
    );

    // Inline code.
    html = html.replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    );

    // Headings.
    html = html.replace(
      /^###\s+(.+)$/gm,
      "<h5>$1</h5>"
    );

    html = html.replace(
      /^##\s+(.+)$/gm,
      "<h4>$1</h4>"
    );

    html = html.replace(
      /^#\s+(.+)$/gm,
      "<h3>$1</h3>"
    );

    // Bold / italic.
    html = html.replace(
      /\*\*\*(.*?)\*\*\*/g,
      "<strong><em>$1</em></strong>"
    );

    html = html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    html = html.replace(
      /__(.*?)__/g,
      "<strong>$1</strong>"
    );

    html = html.replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      "<em>$1</em>"
    );

    // Convert bullet lines into list items.
    html = html.replace(
      /^[ \t]*[-*]\s+(.+)$/gm,
      "<li>$1</li>"
    );

    html = html.replace(
      /(?:<li>.*?<\/li>\s*)+/gs,
      (match) => `<ul>${match}</ul>`
    );

    // Convert numbered lines into ordered list items.
    html = html.replace(
      /^[ \t]*\d+\.\s+(.+)$/gm,
      "<li>$1</li>"
    );

    // Paragraph / line breaks.
    html = html.replace(/\n{2,}/g, "<br><br>");
    html = html.replace(/\n/g, "<br>");

    // Don't add <br> inside block-level lists/headings/code.
    html = html
      .replace(/<\/li><br>/g, "</li>")
      .replace(/<\/ul><br>/g, "</ul>")
      .replace(/<\/h3><br>/g, "</h3>")
      .replace(/<\/h4><br>/g, "</h4>")
      .replace(/<\/h5><br>/g, "</h5>")
      .replace(/<\/pre><br>/g, "</pre>");

    return html;
  }

  function addMessage(role, text) {
    const box = document.querySelector("#vomAiMessages");
    if (!box) return;

    const row = document.createElement("div");
    row.className = "vom-ai-msg " + role;

    const bubble = document.createElement("div");
    bubble.className = "vom-ai-bubble";

    if (role === "assistant") {
      bubble.innerHTML = renderMarkdown(text);
    } else {
      bubble.textContent = text;
    }

    row.appendChild(bubble);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }

  function addTyping() {
    const box = document.querySelector("#vomAiMessages");

    const row = document.createElement("div");
    row.className = "vom-ai-msg assistant";

    row.innerHTML = `
      <div class="vom-ai-bubble">
        <span class="vom-ai-typing" aria-label="AI is typing">
          <span class="vom-ai-dot"></span>
          <span class="vom-ai-dot"></span>
          <span class="vom-ai-dot"></span>
        </span>
      </div>
    `;

    box.appendChild(row);
    box.scrollTop = box.scrollHeight;

    return row;
  }

  function syncTheme() {
    const root = document.querySelector(".vom-ai-root");

    if (root) {
      root.classList.toggle("vom-ai-dark", currentDark());
    }
  }

  window.addEventListener("load", () => {
    render();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
  });
})();
