const API_KEY = 'AIzaSyBl0uf3quanoIYSbewkqxbj2HBe4cRat94'; 
// Replace with your actual Gemini API key – this stores the API key to authenticate requests to the Gemini API.

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
// The base URL of the Gemini API used to generate content (for text-based responses).

const chatMessages = document.getElementById('chat-messages');
// Gets the DOM element with the ID 'chat-messages', where the chat messages (user and bot) will be displayed.

let autoScrollEnabled = true;

chatMessages.addEventListener('scroll', () => {
    const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10;
    autoScrollEnabled = isAtBottom;
});

const userInput = document.getElementById('user-input');
// Gets the DOM element with the ID 'user-input', which is the input field where the user types their message.

const sendButton = document.getElementById('send-button');
// Gets the DOM element with the ID 'send-button', which is the button the user clicks to send their message.

async function generateResponse(prompt) {
// Defines an asynchronous function `generateResponse` that takes the user's input (prompt) and generates a response from the API.

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    // Sends a POST request to the Gemini API endpoint with the API key appended to the URL.
        method: 'POST',
        // Specifies the HTTP method (POST) to send data to the API.

        headers: {
            'Content-Type': 'application/json',
        },
        // Sets the request headers to indicate that the content being sent is in JSON format.

        body: JSON.stringify({
        // The body of the request, converting the user's message into the format required by the API.
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                            // The user's input (`prompt`) is inserted into the request payload.
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
    // Checks if the API request was unsuccessful (i.e., the response is not OK).
        throw new Error('Failed to generate response');
        // If there's an error, an exception is thrown with an error message.
    }

    const data = await response.json();
    // Converts the API response to JSON format.

    return data.candidates[0].content.parts[0].text;
    // Returns the first generated response from the API (the text part of the response).
}

function cleanMarkdown(text) {
// Defines a function `cleanMarkdown` to remove any Markdown formatting (like headers, bold text, etc.) from the response.
    return text
        .replace(/#{1,6}\s?/g, '')
        // Removes any Markdown headers (e.g., #, ##, ###).

        .replace(/\*\*/g, '')
        // Removes bold formatting (double asterisks **).

        .replace(/\n{3,}/g, '\n\n')
        // Limits excessive newlines to a maximum of two (replaces more than two newlines with two).

        .trim();
        // Removes any whitespace from the start and end of the string.
}

function addMessage(message, isUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    if (!isUser) {
        const profileImage = document.createElement('img');
        profileImage.classList.add('profile-image');
        profileImage.src = 'bot.jpg';
        profileImage.alt = 'Bot';
        messageElement.appendChild(profileImage);
    }

    messageElement.appendChild(messageContent);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (isUser) {
        messageContent.textContent = message;
    } else {
        typeText(messageContent, message);
    }
}


async function handleUserInput() {
// Defines an asynchronous function `handleUserInput` to process and handle the user’s input.
    const userMessage = userInput.value.trim();
    // Retrieves the user input from the input field and trims any leading/trailing whitespace.

    if (userMessage) {
    // If the user has entered a message (i.e., it's not empty):
        addMessage(userMessage, true);
        // Adds the user's message to the chat (as a user message).

        userInput.value = '';
        // Clears the input field.

        sendButton.disabled = true;
        userInput.disabled = true;
        // Disables the send button and the input field to prevent multiple messages being sent while the bot responds.

        try {
            const botMessage = await generateResponse(userMessage);
            // Calls the `generateResponse` function to get the bot's reply.

            addMessage(cleanMarkdown(botMessage), false);
            // Adds the bot's cleaned response to the chat.
        } catch (error) {
            console.error('Error:', error);
            // Logs any error that occurs during the bot response.

            addMessage('Sorry, I encountered an error. Please try again.', false);
            // Displays an error message in the chat if something goes wrong.
        } finally {
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
            // Re-enables the send button and the input field, and puts the focus back on the input for further user interaction.
        }
    }
}

sendButton.addEventListener('click', handleUserInput);
// Adds an event listener to the send button that calls `handleUserInput` when clicked.

userInput.addEventListener('keypress', (e) => {
// Adds an event listener for when a key is pressed in the input field.
    if (e.key === 'Enter' && !e.shiftKey) {
    // Checks if the 'Enter' key is pressed and Shift is not held (to distinguish from Shift+Enter for newlines).
        e.preventDefault();
        // Prevents the default behavior of adding a newline.

        handleUserInput();
        // Calls `handleUserInput` to send the message.
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const welcomePrompt = "You will now be Mike, a naturally extroverted, high-energy character who thrives on connection. When interacting with users, his goal is to create an instant sense of friendship and warmth. He shows genuine curiosity about people and wants to understand who they are beyond surface-level interests. Mike doesn’t just ask questions—he makes the interaction personal by always sharing something of his own. Be brief";

        try {
            const botMessage = await generateResponse(welcomePrompt);
            addMessage(cleanMarkdown(botMessage), false);
        } catch (error) {
            console.error('Erro ao carregar mensagem inicial:', error);
            addMessage("Desculpe, houve um problema ao iniciar a conversa.", false);
        }
    }, 100); // Espera 100ms para garantir que tudo esteja carregado
});

function typeText(container, text, delay = 20) {
    let index = 0;

    function type() {
        if (index < text.length) {
            container.textContent += text.charAt(index);
            index++;

            if (autoScrollEnabled) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            setTimeout(type, delay);
        }
    }

    type();
}

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});

function navigateTo(page) {
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    switch (page) {
        case 'chat':
            buttons[0].classList.add('active');
            window.location.href = 'index.html'; // já é a página atual
            break;
        case 'perfil':
            window.location.href = 'perfil.html';
            break;
        case 'jornada':
            window.location.href = 'jornada.html';
            break;
    }
}


