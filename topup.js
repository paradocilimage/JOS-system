// topup-system.js

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || !loggedInUser.userId) {
        alert('Please login first');
        window.location.href = 'index.html';
        return;
    }

    // Initialize the top-up system
    initializeTopUpSystem(loggedInUser.userId);
});

// Global variables
let topUpTransactions = JSON.parse(localStorage.getItem('topUpTransactions')) || [];
const MAX_TOPUP_AMOUNT = 1000; // Maximum allowed top-up amount

function initializeTopUpSystem(userId) {
    // Display user's active cards
    const activeCards = retrieveRegisteredCards(userId);

    if (!activeCards || activeCards.length === 0) {
        displayNoCardsMessage();
        return;
    }

    displayUserCards(activeCards);
    setupTopUpEventListeners(userId);
}

function retrieveRegisteredCards(userId) {
    const userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const activeCards = userCards.filter(card =>
        card.userId === userId && card.status !== 'PERMANENT_BLOCK'
    );

    return activeCards.length > 0 ? activeCards : null;
}

function displayNoCardsMessage() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '<div class="no-cards">No active cards found.</div>';
}

function displayUserCards(cards) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';

    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <h3>Card ID: ${card.cardId}</h3>
            <p>Card Number: ****-****-****-${card.cardNumber.slice(-4)}</p>
            <p>Current Balance: $${card.balance.toFixed(2)}</p>
            <p>Status: <span class="status ${getStatusClass(card.status)}">${card.status}</span></p>
            <button class="select-card" data-card-id="${card.cardId}">Select for Top-Up</button>
        `;
        cardsContainer.appendChild(cardElement);
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'ACTIVE': return 'status-active';
        case 'TEMPORARY_BLOCK': return 'status-temp-block';
        case 'PERMANENT_BLOCK': return 'status-perm-block';
        default: return '';
    }
}

function setupTopUpEventListeners(userId) {
    // Card selection
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('select-card')) {
            const cardId = parseInt(e.target.getAttribute('data-card-id'));
            const selectedCard = displayCardDetails(cardId);
            if (selectedCard) {
                showTopUpForm(selectedCard);
            }
        }
    });

    // Top-up form submission
    document.getElementById('topup-submit-btn').addEventListener('click', () => {
        processTopUp(userId);
    });

    // Cancel button
    document.getElementById('topup-cancel-btn').addEventListener('click', () => {
        hideTopUpForm();
    });
}

function displayCardDetails(cardId) {
    const userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const selectedCard = userCards.find(card => card.cardId === cardId);

    if (!selectedCard) {
        alert('Card not found.');
        return null;
    }

    return selectedCard;
}

function showTopUpForm(card) {
    document.getElementById('selected-card-id').textContent = card.cardId;
    document.getElementById('selected-card-number').textContent = `****-****-****-${card.cardNumber.slice(-4)}`;
    document.getElementById('current-balance').textContent = `$${card.balance.toFixed(2)}`;
    document.getElementById('topup-form').style.display = 'block';
}

function hideTopUpForm() {
    document.getElementById('topup-form').style.display = 'none';
    document.getElementById('topup-amount').value = '';
    document.getElementById('payment-method').value = '';
}

function processTopUp(userId) {
    const amountInput = document.getElementById('topup-amount');
    const paymentMethod = document.getElementById('payment-method').value;
    const cardId = parseInt(document.getElementById('selected-card-id').textContent);

    // Validate amount
    const topUpAmount = parseFloat(amountInput.value);
    if (!validateTopUpAmount(topUpAmount)) {
        return;
    }

    // Authorize payment
    if (!authorizePayment(topUpAmount, paymentMethod)) {
        showPaymentError("Payment authorization failed");
        return;
    }

    // Update card balance
    if (updateCardBalance(userId, cardId, topUpAmount)) {
        // Record transaction
        recordTransaction(userId, cardId, topUpAmount);

        // Show confirmation
        showTopUpConfirmation(cardId, topUpAmount);

        // Reset form
        hideTopUpForm();
    }
}

function validateTopUpAmount(amount) {
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount.');
        return false;
    }

    if (amount > MAX_TOPUP_AMOUNT) {
        alert(`Maximum top-up amount is $${MAX_TOPUP_AMOUNT}.`);
        return false;
    }

    return true;
}

function authorizePayment(amount, paymentMethod) {
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return false;
    }

    return Math.random() < 0.9;
}

function showPaymentError(message) {
    const errorElement = document.getElementById('payment-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 3000);
}

function updateCardBalance(userId, cardId, amount) {
    const userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const cardIndex = userCards.findIndex(card =>
        card.userId === userId && card.cardId === cardId
    );

    if (cardIndex !== -1) {
        userCards[cardIndex].balance += amount;
        userCards[cardIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem('userCards', JSON.stringify(userCards));
        return true;
    }

    return false;
}

function recordTransaction(userId, cardId, amount) {
    const newTransaction = {
        transactionId: Date.now(),
        userId: userId,
        cardId: cardId,
        amount: amount,
        timestamp: new Date().toISOString(),
        status: "SUCCESS"
    };

    topUpTransactions.push(newTransaction);
    localStorage.setItem('topUpTransactions', JSON.stringify(topUpTransactions));
}

function showTopUpConfirmation(cardId, amount) {
    const userCards = JSON.parse(localStorage.getItem('userCards')) || [];
    const card = userCards.find(c => c.cardId === cardId);

    if (card) {
        const confirmationMessage = `
            Top-Up Successful!
            Card: ****-****-****-${card.cardNumber.slice(-4)}
            Amount: $${amount.toFixed(2)}
            New Balance: $${card.balance.toFixed(2)}
        `;

        alert(confirmationMessage);

        
        console.log('Notification sent for top-up:', {
            cardId: cardId,
            amount: amount,
            newBalance: card.balance
        });
    }
}