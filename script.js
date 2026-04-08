/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestionText = document.getElementById("latestQuestionText");

const WORKER_URL = "https://tiny-union-306f.lilwrestlingfire13.workers.dev/";

// Clear, concise system prompt that keeps the chatbot on-topic.
const SYSTEM_PROMPT =
  "You are a L'Oréal beauty assistant. Only answer questions about L'Oréal products, ingredients, routines, and recommendations. If a question is unrelated, politely say you can only help with L'Oréal beauty topics and ask a relevant follow-up question.";

// We keep message history so the chat has context.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

/* Reusable message renderer */
function addMessage(role, text) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("msg");
  messageEl.classList.add(role === "user" ? "user" : "assistant");
  messageEl.textContent = text;
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial message
chatWindow.innerHTML = "";
addMessage(
  "assistant",
  "Hello! Ask me about L'Oréal products, routines, or recommendations.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  addMessage("user", userMessage);
  latestQuestionText.textContent = userMessage;
  userInput.value = "";

  messages.push({ role: "user", content: userMessage });

  sendBtn.disabled = true;
  addMessage("assistant", "Thinking...");

  try {
    // Send the conversation to the Cloudflare Worker, which forwards it to OpenAI.
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const apiError =
        data.error?.message || "Request failed. Please try again.";
      throw new Error(apiError);
    }

    // Cloudflare and direct OpenAI responses both use this path.
    const assistantReply = data.choices[0].message.content;

    // Remove the temporary "Thinking..." message.
    chatWindow.removeChild(chatWindow.lastElementChild);

    addMessage("assistant", assistantReply);
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    // Remove the temporary "Thinking..." message.
    chatWindow.removeChild(chatWindow.lastElementChild);
    addMessage("assistant", `Error: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
