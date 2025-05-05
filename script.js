import { GoogleGenerativeAI } from "@google/generative-ai";

// == Google Generative AI Setup ==
const businessInfo = `General Business Information:"`;
const API_KEY = 'AIzaSyBl0uf3quanoIYSbewkqxbj2HBe4cRat94';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: businessInfo });
let messages = { history: [] };
let autoScrollEnabled = true;

// == Utility ==
function cleanMarkdown(text) {
  return text.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
function typeText(container, text, delay = 20) {
  let i = 0; function type() {
    if (i < text.length) {
      container.textContent += text[i++];
      if (autoScrollEnabled) container.parentElement.scrollTop = container.parentElement.scrollHeight;
      setTimeout(type, delay);
    }
  } type();
}

function addMessage(msg, isUser, chatMessages) {
  const el = document.createElement('div');
  el.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  const content = document.createElement('div'); content.className = 'message-content';
  if (!isUser) {
    const img = document.createElement('img'); img.className = 'profile-image'; img.src = 'bot.jpg'; img.alt = 'Bot'; el.append(img);
  }
  el.append(content); chatMessages.append(el);
  if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;
  if (isUser) content.textContent = msg; else typeText(content, msg);
  return content;
}

async function sendMessage(userInput, sendButton, chatMessages) {
  const text = userInput.value.trim(); if (!text) return;
  addMessage(text, true, chatMessages);
  userInput.value = ''; sendButton.disabled = true; userInput.disabled = true;
  const loader = document.createElement('div'); loader.className = 'loader'; chatMessages.append(loader);
  if (autoScrollEnabled) chatMessages.scrollTop = chatMessages.scrollHeight;
  try {
    const chat = model.startChat(messages);
    const res = await chat.sendMessageStream(text);
    loader.remove(); const botCont = addMessage('', false, chatMessages);
    let collected = '';
    for await (const chunk of res.stream) {
      collected += cleanMarkdown(chunk.text()); botCont.textContent = collected;
    }
    messages.history.push({ role: 'user', parts: [{ text }] });
    messages.history.push({ role: 'model', parts: [{ text: collected }] });
  } catch (e) {
    loader.remove(); addMessage('Error. Try again.', false, chatMessages); console.error(e);
  } finally { sendButton.disabled = false; userInput.disabled = false; userInput.focus(); }
}

// == DOM Ready ==
document.addEventListener('DOMContentLoaded', () => {
  // Selectors with fallbacks
  const chatMessages = document.getElementById('chat-messages') || document.querySelector('.chat-window .messages');
  const userInput = document.getElementById('user-input') || document.querySelector('.chat-window .input-area textarea, .chat-window .input-area input');
  const sendButton = document.getElementById('send-button') || document.querySelector('.chat-window .input-area button');
  const openBtn = document.querySelector('.chat-button');
  const closeBtn = document.querySelector('.chat-window .close');
  const themeToggle = document.getElementById('theme-toggle');
  const tabs = document.querySelectorAll('.tab-button');

  // Open/Close Chat
  openBtn?.addEventListener('click', () => document.body.classList.add('chat-open'));
  closeBtn?.addEventListener('click', () => document.body.classList.remove('chat-open'));

  // Scroll
  chatMessages?.addEventListener('scroll', () => {
    autoScrollEnabled = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10;
  });

  // Send
  sendButton?.addEventListener('click', () => sendMessage(userInput, sendButton, chatMessages));
  userInput?.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(userInput, sendButton, chatMessages); }
  });

  // Theme
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
  });

  // Tabs
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const p = btn.dataset.page; if (p) window.location.href = `${p}.html`;
  }));

  // Welcome
  setTimeout(async () => {
    const welcome = `You will now be Mike... Be brief`;
    try {
      const chat = model.startChat(messages);
      const res = await chat.sendMessageStream(welcome);
      let w=''; for await (const c of res.stream) w += cleanMarkdown(c.text());
      addMessage(w, false, chatMessages);
      messages.history.push({ role:'model', parts:[{text:w}] });
    } catch { addMessage('Startup error.', false, chatMessages); }
  }, 100);
});
