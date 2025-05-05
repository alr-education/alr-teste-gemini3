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
let autoScrollEnabled = true;

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
      if (autoScrollEnabled) container.parentElement.scrollTop = container.parentElement.scrollHeight;
      setTimeout(type, delay);
    }
  }
  type();
}

function addMessage(message, isUser, chatMessages, userInput, sendButton) {
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

async function sendMessage(userInput, sendButton, chatMessages) {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, true, chatMessages);
  userInput.value = '';
  sendButton.disabled = true;
  userInput.disabled = true;

  const loader = document.createElement('div');
  loader.classList.add('loader');
  chatMessages.appendChild(loader);
  if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const chat = model.startChat(messages);
    const result = await chat.sendMessageStream(text);

    loader.remove();
    const botCont = addMessage('', false, chatMessages);
    let collected = '';

    for await (const chunk of result.stream) {
      const txt = cleanMarkdown(chunk.text());
      collected += txt;
      botCont.textContent = collected;
    }

    messages.history.push({ role: 'user', parts: [{ text }] });
    messages.history.push({ role: 'model', parts: [{ text: collected }] });
  } catch (e) {
    loader.remove();
    addMessage('Sorry, I encountered an error. Please try again.', false, chatMessages);
    console.error(e);
  } finally {
    sendButton.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// == DOMContentLoaded Setup ==
document.addEventListener('DOMContentLoaded', () => {
  // == DOM Elements ==
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const themeToggle = document.getElementById('theme-toggle');
  const tabButtons = document.querySelectorAll('.tab-button');

  // == Scroll Handling ==
  chatMessages.addEventListener('scroll', () => {
    const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10;
    autoScrollEnabled = isAtBottom;
  });

  // == Event Listeners ==
  sendButton.addEventListener('click', () => sendMessage(userInput, sendButton, chatMessages));
  userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput, sendButton, chatMessages);
    }
  });

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
  });

  tabButtons.forEach(btn => btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.getAttribute('data-page');
    if (page) window.location.href = `${page}.html`;
  }));

  // == Welcome Message ==
  setTimeout(async () => {
    const welcome = `You will now be Mike, a naturally extroverted, high-energy character who thrives on connection. When interacting with users, his goal is to create an instant sense of friendship and warmth. He shows genuine curiosity about people and wants to understand who they are beyond surface-level interests. Mike doesn’t just ask questions—he makes the interaction personal by always sharing something of his own. Be brief`;
    try {
      const chat = model.startChat(messages);
      const res = await chat.sendMessageStream(welcome);
      let wtext = '';
      for await (const c of res.stream) wtext += cleanMarkdown(c.text());
      addMessage(wtext, false, chatMessages);
      messages.history.push({ role: 'model', parts: [{ text: wtext }] });
    } catch {
      addMessage('Desculpe, houve um problema ao iniciar a conversa.', false, chatMessages);
    }
  }, 100);
});
