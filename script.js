import { GoogleGenerativeAI } from "@google/generative-ai";

// == Google Generative AI Setup ==
const businessInfo = `General Business Information:"`;
const API_KEY = 'AIzaSyBl0uf3quanoIYSbewkqxbj2HBe4cRat94'; // Your Gemini API key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: businessInfo
});

let messages = { history: [] };

// == DOM Elements ==
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
let autoScrollEnabled = true;

// == Scroll Handling ==
chatMessages.addEventListener('scroll', () => {
  const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10;
  autoScrollEnabled = isAtBottom;
});

// == Utility Functions ==
function cleanMarkdown(text) {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function typeText(container, text, delay = 20) {
  let index = 0;
  function type() {
    if (index < text.length) {
      container.textContent += text.charAt(index);
      index++;
      if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;
      setTimeout(type, delay);
    }
  }
  type();
}

function addMessage(message, isUser) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
  const content = document.createElement('div');
  content.classList.add('message-content');

  if (!isUser) {
    const img = document.createElement('img');
    img.classList.add('profile-image');
    img.src = 'bot.jpg';
    img.alt = 'Bot';
    messageElement.appendChild(img);
  }

  messageElement.appendChild(content);
  chatMessages.appendChild(messageElement);
  if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;

  if (isUser) {
    content.textContent = message;
  } else {
    typeText(content, message);
  }
  return content;
}

// == Streaming Chat ==
async function sendMessage() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // show user message
  addMessage(userMessage, true);
  userInput.value = '';
  sendButton.disabled = true;
  userInput.disabled = true;

  // loader
  const loader = document.createElement('div');
  loader.classList.add('loader');
  chatMessages.appendChild(loader);
  if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const chat = model.startChat(messages);
    const result = await chat.sendMessageStream(userMessage);

    // prepare bot message container
    loader.remove();
    const botContainer = addMessage('', false);
    let collected = '';

    for await (const chunk of result.stream) {
      const txt = cleanMarkdown(chunk.text());
      collected += txt;
      botContainer.textContent = collected;
    }

    // update history
    messages.history.push({ role: 'user', parts: [{ text: userMessage }] });
    messages.history.push({ role: 'model', parts: [{ text: collected }] });
  } catch (err) {
    loader.remove();
    addMessage('Sorry, I encountered an error. Please try again.', false);
    console.error(err);
  } finally {
    sendButton.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// == Event Listeners ==
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    const welcomePrompt = `You will now be Mike, a naturally extroverted, high-energy character who thrives on connection. When interacting with users, his goal is to create an instant sense of friendship and warmth. He shows genuine curiosity about people and wants to understand who they are beyond surface-level interests. Mike doesn’t just ask questions—he makes the interaction personal by always sharing something of his own. Be brief`;
    try {
      const chat = model.startChat(messages);
      const result = await chat.sendMessageStream(welcomePrompt);
      let welcome = '';
      for await (const c of result.stream) {
        welcome += cleanMarkdown(c.text());
      }
      addMessage(welcome, false);
      messages.history.push({ role: 'model', parts: [{ text: welcome }] });
    } catch {
      addMessage('Desculpe, houve um problema ao iniciar a conversa.', false);
    }
  }, 100);
});

// == Theme Toggle ==
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

// == Navigation Tabs ==
function navigateTo(page) {
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  const mapping = { chat: 0, perfil: 1, jornada: 2 };
  if (mapping[page] !== undefined) buttons[mapping[page]].classList.add('active');
  window.location.href = `${page}.html`;
}
