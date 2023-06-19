/*----------------
    VARIABLES
-----------------*/

// ChatGPT configuration
const API_BASE_URL = 'https://api.openai.com/v1';
const API_KEY = ''; // Put yor OpenAI Key here
const GPT_MODEL = 'gpt-3.5-turbo';

// HTML main elements
const loader = document.querySelector('.loading');
const genreButtons = document.querySelectorAll('.genre');
const placeholder = document.querySelector('#placeholder');
const stageTemplate = document.querySelector('#stage-template');
const gameoverTemplate = document.querySelector('#gameover-template');

// Keep all the chat
const completeChat = [];

// Keep the selected genre
let selectedGenre;

/*----------------
    FUNCTIONS
-----------------*/

function startGame() {
    // Put the gamestarted class
    document.body.classList.add('game-started');

    // Prepare the initials instructions for ChatGPT
    completeChat.push({
        role: 'system',
        content: `Voglio che ti comporti come se fossi un classico gioco di avventura testuale. Io sarò il protagonista e giocatore principale. Non fare riferimento a te stesso. L\'ambientazione di questo gioco sarà a tema ${selectedGenre}. Ogni ambientazione ha una descrizione di massimo 400 caratteri seguita da una array di 3 azioni possibili che il giocatore può compiere. Solo una di queste azioni è mortale e termina il gioco. Non aggiungere mai altre spiegazioni. Non fare riferimento a te stesso. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description":"descrizione ambientazione","actions":["azione 1", "azione 2", "azione 3"]}###`
    });

    // Start first stage
    setStage();
};

async function setStage() {
    // Clear placeholder
    placeholder.innerHTML = '';

    // Show loader
    loader.classList.remove('hidden');

    // Ask to ChatGPT to create the stage
    const gptResponse = await makeRequest('/chat/completions', {
        temperature: 0.7,
        model: GPT_MODEL,
        messages: completeChat
    });
    
    // Hide loader
    loader.classList.add('hidden');
    
    // Take ChatGPT message and put in the complete chat
    const message = gptResponse.choices[0].message
    completeChat.push(message);

    // Take the message content (actions, description)
    const content = JSON.parse(message.content);
    const actions = content.actions;
    const description = content.description;

    if (actions.length === 0) {
        setGameOver(description);
    } else {
        // Show stage description
        setStageDescription(description);
    
        // Generate and show the stage image
        await setStagePicture(description);
    
        // Show aviable actions
        setStageActions(actions);
    };

};

async function makeRequest(endpoint, payload) {
    const url = API_BASE_URL + endpoint;

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        }
    });

    const jsonResponse = await response.json();
    return jsonResponse;
};

function setStageDescription(description) {
    // Clone stage template
    stageElement = stageTemplate.content.cloneNode(true);

    // Insert description
    stageElement.querySelector('.stage-description').innerText = description;

    // Build in page
    placeholder.appendChild(stageElement);
};

async function setStagePicture(description) {
    // Ask to OpenAI to generate an image
    const generatedImage = await makeRequest('/images/generations', {
        n: 1,
        size: '512x512',
        response_format: 'url',
        prompt: `questa è una storia basata su ${selectedGenre}. ${description}`
    });

    // Take the URL image
    const imageURL = generatedImage.data[0].url;

    // Create a image tag
    const image = `<img src="${imageURL}" alt="image-description">`

    // Put it in the page
    document.querySelector('.stage-img').innerHTML = image;
};

function setStageActions(actions) {
    // Build HTML actions
    let actionsHTML = '';
    actions.forEach(function(action) {
        actionsHTML += `<button>${action}</button>`;
    });

    // Build in page
    document.querySelector('.stage-actions').innerHTML = actionsHTML;

    // Take the buttons
    const actionButtons = document.querySelectorAll('.stage-actions button');

    // For each button...
    actionButtons.forEach(function(button) {
        // When click
        button.addEventListener('click', function() {
            // Take the action
            const selectedAction = button.innerText;

            // Prepare a message for ChatGPT
            completeChat.push({
                role: `user`,
                content: `${selectedAction}. Se questa azione è mortale l'elenco delle azioni è vuoto. Non dare altro testo che non sia un oggetto JSON. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description": "sei morto per questa motivazione", "actions": []}###`
            });

            // Ask to generate a new stage
            setStage();
        })
    });
};

function setGameOver(description) {
    // Clone game over template
    const gameoverElement = gameoverTemplate.content.cloneNode(true);

    // Insert the description in the template
    gameoverElement.querySelector('.gameover-message').innerText = description;

    // Insert template in page
    placeholder.appendChild(gameoverElement);

    // Take the button from template
    const replayButton = document.querySelector('.restart-btn');

    // When click...
    replayButton.addEventListener('click', function() {
        // Reload page
        window.location.reload();
    });
};

/*----------------
    INIT & EVENTS
-----------------*/

// For each genre button...
genreButtons.forEach(function(button) {
    // When click...
    button.addEventListener('click', function() {
        // Take the selected genre
        // Put it in the variable
        selectedGenre = button.dataset.genre;
        console.log(selectedGenre);

        // Start the game
        startGame();
    });
});
