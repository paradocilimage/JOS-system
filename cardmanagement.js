// card-management.js - Fully Functional Version

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || !loggedInUser.userId) {
        alert('Please login first');
        window.location.href = 'index.html';
        return;
    }

    // Initialize the card system
    initializeCardSystem(loggedInUser.userId);
});

function initializeCardSystem(userId) {
    // Load or create user card
    const userCard = loadOrCreateUserCard(userId);

    // Display card information
    displayCardInfo(userCard);

    // Set up all event listeners
    setupEventListeners(userId);
}

// Card storage functions
function loadOrCreateUserCard(userId) {
    let userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    let userCard = userCards.find(card => card.userId === userId);

    if (!userCard) {
        userCard = {
            cardId: generateRandomCardId(),
            userId: userId,
            cardNumber: generateRandomCardNumber(),
            status: 'ACTIVE',
            balance: 0,
            lastUpdated: new Date().toISOString()
        };

        userCards.push(userCard);
        localStorage.setItem('userCards', JSON.stringify(userCards));
    }

    return userCard;
}

function updateUserCard(updatedCard) {
    let userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const index = userCards.findIndex(card => card.userId === updatedCard.userId);

    if (index !== -1) {
        userCards[index] = updatedCard;
        localStorage.setItem('userCards', JSON.stringify(userCards));
        return true;
    }
    return false;
}

// Helper functions
function generateRandomCardId() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit ID
}

function generateRandomCardNumber() {
    let number = '';
    for (let i = 0; i < 16; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

function formatCardNumber(cardNumber) {
    return `****-****-****-${cardNumber.slice(-4)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// UI Functions
function displayCardInfo(card) {
    document.getElementById('card-number-display').textContent = formatCardNumber(card.cardNumber);
    document.getElementById('card-id-display').textContent = card.cardId;

    const statusElement = document.getElementById('card-status');
    statusElement.textContent = card.status;
    updateStatusClass(statusElement, card.status);

    document.getElementById('last-updated').textContent = formatDate(card.lastUpdated);

    // Update button visibility based on current status
    updateButtonVisibility(card.status);
}

function updateStatusClass(element, status) {
    element.className = 'status';
    switch (status) {
        case 'ACTIVE':
            element.classList.add('status-active');
            break;
        case 'TEMPORARY_BLOCK':
            element.classList.add('status-temp-block');
            break;
        case 'PERMANENT_BLOCK':
            element.classList.add('status-perm-block');
            break;
    }
}

function updateButtonVisibility(status) {
    // Hide all buttons first
    document.getElementById('temp-block').style.display = 'none';
    document.getElementById('perm-block').style.display = 'none';
    document.getElementById('unblock-card').style.display = 'none';
    document.getElementById('request-replacement').style.display = 'none';

    // Show relevant buttons based on status
    switch (status) {
        case 'PERMANENT_BLOCK':
            document.getElementById('request-replacement').style.display = 'block';
            break;
        case 'TEMPORARY_BLOCK':
            document.getElementById('perm-block').style.display = 'block';
            document.getElementById('unblock-card').style.display = 'block';
            break;
        case 'ACTIVE':
            document.getElementById('temp-block').style.display = 'block';
            document.getElementById('perm-block').style.display = 'block';
            break;
    }
}

// Event Handlers
function setupEventListeners(userId) {
    // Main action buttons
    document.getElementById('temp-block').addEventListener('click', () => handleTempBlock());
    document.getElementById('perm-block').addEventListener('click', () => handlePermBlock());
    document.getElementById('request-replacement').addEventListener('click', () => handleReplacement());
    document.getElementById('unblock-card').addEventListener('click', () => handleUnblock());
    document.getElementById('cancel').addEventListener('click', () => window.location.href = "dashboard.html");

    // Confirmation buttons
    document.getElementById('temp-block-confirm-btn').addEventListener('click', () => confirmStatusChange('TEMPORARY_BLOCK'));
    document.getElementById('perm-block-confirm-btn').addEventListener('click', () => confirmStatusChange('PERMANENT_BLOCK'));
    document.getElementById('unblock-confirm-btn').addEventListener('click', () => confirmStatusChange('ACTIVE'));
    document.getElementById('replacement-submit-btn').addEventListener('click', () => submitReplacementRequest());
}

function handleTempBlock() {
    const currentStatus = document.getElementById('card-status').textContent;
    if (currentStatus === 'PERMANENT_BLOCK') {
        alert('Cannot temporarily block - card is permanently blocked.');
        return;
    }
    showConfirmation('temp-block-confirm');
}

function handlePermBlock() {
    const currentStatus = document.getElementById('card-status').textContent;
    if (currentStatus === 'PERMANENT_BLOCK') {
        alert('Card is already permanently blocked.');
        return;
    }
    showConfirmation('perm-block-confirm');
}

function handleReplacement() {
    const currentStatus = document.getElementById('card-status').textContent;
    if (currentStatus !== 'PERMANENT_BLOCK') {
        alert('Can only request replacement for permanently blocked cards.');
        return;
    }
    showConfirmation('replacement-form');
}

function handleUnblock() {
    const currentStatus = document.getElementById('card-status').textContent;
    if (currentStatus === 'PERMANENT_BLOCK') {
        alert('Cannot unblock - card is permanently blocked. Please request a replacement.');
        return;
    }
    if (currentStatus === 'ACTIVE') {
        alert('Card is already active.');
        return;
    }
    showConfirmation('unblock-confirm');
}

function confirmStatusChange(newStatus) {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) return;

    let userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const cardIndex = userCards.findIndex(card => card.userId === loggedInUser.userId);

    if (cardIndex !== -1) {
        // Update card status
        userCards[cardIndex].status = newStatus;
        userCards[cardIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem('userCards', JSON.stringify(userCards));

        // Update UI
        const statusElement = document.getElementById('card-status');
        statusElement.textContent = newStatus;
        updateStatusClass(statusElement, newStatus);

        document.getElementById('last-updated').textContent = formatDate(new Date());
        updateButtonVisibility(newStatus);
        hideConfirmations();
        showSuccessMessage(`Card status updated to ${newStatus}`);
    }
}

function submitReplacementRequest() {
    const reason = document.getElementById('replacement-reason').value;
    if (!reason) {
        alert('Please select a reason for replacement.');
        return;
    }

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) return;

    let userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const cardIndex = userCards.findIndex(card => card.userId === loggedInUser.userId);

    if (cardIndex !== -1) {
        // Create new card to replace the old one
        userCards[cardIndex] = {
            cardId: generateRandomCardId(),
            userId: loggedInUser.userId,
            cardNumber: generateRandomCardNumber(),
            status: 'ACTIVE',
            balance: userCards[cardIndex].balance, // Keep the same balance
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('userCards', JSON.stringify(userCards));

        // Update UI with new card
        displayCardInfo(userCards[cardIndex]);
        hideConfirmations();
        showSuccessMessage('New replacement card issued successfully!');
    }
}

// UI Helper Functions
function showConfirmation(confirmationId) {
    hideConfirmations();
    document.getElementById(confirmationId).style.display = 'block';
}

function hideConfirmations() {
    document.querySelectorAll('.confirmation').forEach(el => {
        el.style.display = 'none';
    });
}

function showSuccessMessage(message) {
    const successElement = document.getElementById('action-success');
    document.getElementById('success-message').textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => successElement.style.display = 'none', 3000);
}