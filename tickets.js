// Initialize tickets and users
const tickets = [
    { id: 101, route: "Kingston to Montego Bay", price: 250, availability: 30 },
    { id: 102, route: "Ocho Rios to Kingston", price: 220, availability: 20 },
    { id: 103, route: "Montego Bay to Negril", price: 180, availability: 15 },
    { id: 104, route: "Halfway Tree to Downtown Kingston", price: 120, availability: 50 },
    { id: 105, route: "Downtown Kingston to Halfway Tree", price: 120, availability: 45 },
    { id: 106, route: "Halfway Tree to Spanish Town", price: 150, availability: 25 },
    { id: 107, route: "Spanish Town to Halfway Tree", price: 150, availability: 25 },
    { id: 108, route: "Spanish Town to May Pen", price: 180, availability: 20 },
    { id: 109, route: "May Pen to Spanish Town", price: 180, availability: 20 },
    { id: 110, route: "Kingston to Port Antonio", price: 230, availability: 15 },
    { id: 111, route: "Port Antonio to Kingston", price: 230, availability: 15 }
];

let paymentTryCount = 0;
const currentUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

// System initialization
function initializeSystem() {
    // Check if user is logged in
    if (currentUser) {
        document.getElementById("userName").textContent = currentUser.fullName;
        document.getElementById("userId").textContent = currentUser.userId;
        displayOptions();
    } else {
        window.location.href = "index.html"; // Redirect to login if user is not logged in
    }
}

// Display options
function displayOptions() {
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer) {
        optionsContainer.innerHTML = `
            <h2>Select an Option:</h2>
            <button onclick="displayAvailableTickets()">View Available Tickets</button>
            <button onclick="showPurchaseForm()">Purchase Ticket</button>
            <button onclick="exitSystem()">Exit</button>
        `;
    }

    // Hide other sections initially
    document.getElementById("ticket-list-section").style.display = "none";
    document.getElementById("purchase-form-section").style.display = "none";
}

// Display available tickets
function displayAvailableTickets() {
    document.getElementById("options-container").style.display = "none";
    document.getElementById("ticket-list-section").style.display = "block";

    const ticketList = document.getElementById("ticket-list");
    ticketList.innerHTML = ""; // Clear previous content

    let hasAvailableTickets = false;

    tickets.forEach(ticket => {
        const ticketDiv = document.createElement("div");
        ticketDiv.classList.add("ticket");

        const availabilityStatus = ticket.availability > 0 ?
            `<span class="available">Available (${ticket.availability} seats)</span>` :
            `<span class="unavailable">Not Available</span>`;

        ticketDiv.innerHTML = `
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
            <p><strong>Route:</strong> ${ticket.route}</p>
            <p><strong>Price:</strong> JMD ${ticket.price.toFixed(2)}</p>
            <p><strong>Status:</strong> ${availabilityStatus}</p>
        `;

        if (ticket.availability > 0) {
            hasAvailableTickets = true;
            const purchaseButton = document.createElement("button");
            purchaseButton.textContent = "Purchase Now";
            purchaseButton.onclick = function () {
                selectTicket(ticket.id);
            };
            ticketDiv.appendChild(purchaseButton);
        }

        ticketList.appendChild(ticketDiv);
    });

    if (!hasAvailableTickets) {
        ticketList.innerHTML = "<p>No tickets available at this time.</p>";
    }

    // Add back button
    const backButton = document.createElement("button");
    backButton.textContent = "Back to Options";
    backButton.classList.add("back-button");
    backButton.onclick = displayOptions;
    ticketList.appendChild(backButton);
}

// Show the purchase form
function showPurchaseForm() {
    document.getElementById("options-container").style.display = "none";
    document.getElementById("purchase-form-section").style.display = "block";

    // Reset the form
    document.getElementById("ticketId").value = "";
    document.getElementById("userId").value = currentUser ? currentUser.userId : "";
    document.getElementById("paymentMethod").value = "";
    document.getElementById("paymentDetails").value = "";
    document.getElementById("purchaseMessage").textContent = "";
    document.getElementById("paymentDetailsSection").style.display = "none";
}

// Select a ticket from the list
function selectTicket(ticketId) {
    document.getElementById("ticket-list-section").style.display = "none";
    document.getElementById("purchase-form-section").style.display = "block";

    document.getElementById("ticketId").value = ticketId;
    document.getElementById("userId").value = currentUser ? currentUser.userId : "";
    document.getElementById("purchaseMessage").textContent = `Selected Ticket ID: ${ticketId}`;
}

// Handle payment method change
document.getElementById("paymentMethod").addEventListener("change", function () {
    const paymentDetailsSection = document.getElementById("paymentDetailsSection");
    if (this.value === "cash") {
        paymentDetailsSection.style.display = "none"; // Hide payment details for cash
    } else {
        paymentDetailsSection.style.display = "block"; // Show payment details for other methods
    }
});

// Validate payment
function validatePayment(paymentMethod, paymentDetails) {

    // For demo purposes, any card starting with '4' is valid (like Visa)
    if (paymentMethod === "credit" || paymentMethod === "debit") {
        return paymentDetails && paymentDetails.trim().startsWith('4') && paymentDetails.trim().length >= 8;
    }

    return false;
}

// Handle ticket purchase
document.getElementById("purchaseForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Find matching user ID
    const userId = document.getElementById("userId").value;
    if (!userId || userId != currentUser.userId) {
        document.getElementById("purchaseMessage").textContent = "Invalid user ID!";
        return;
    }

    // Find matching ticket ID
    const ticketId = parseInt(document.getElementById("ticketId").value);
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        document.getElementById("purchaseMessage").textContent = "Invalid Ticket ID!";
        return;
    }

    // Check if ticket is available
    if (ticket.availability <= 0) {
        document.getElementById("purchaseMessage").textContent = "Ticket not available!";
        return;
    }

    // Make payment
    const paymentMethod = document.getElementById("paymentMethod").value;
    const paymentDetails = document.getElementById("paymentDetails").value;

    const paymentValid = validatePayment(paymentMethod, paymentDetails);

    if (!paymentValid) {
        paymentTryCount++;

        if (paymentTryCount < 3) {
            document.getElementById("purchaseMessage").innerHTML = `Payment failed! Try again (Attempt ${paymentTryCount} of 3).<br>Please check your payment details.`;
            return;
        } else {
            document.getElementById("purchaseMessage").innerHTML = `Too many failed payment attempts. Please try again in 2 minutes.`;

            // Disable the purchase button for 2 minutes
            const purchaseButton = document.querySelector("#purchaseForm button[type='submit']");
            purchaseButton.disabled = true;

            setTimeout(() => {
                purchaseButton.disabled = false;
                paymentTryCount = 0;
                document.getElementById("purchaseMessage").textContent = "You can try payment again now.";
            }, 2 * 60 * 1000); // 2 minutes in milliseconds

            return;
        }
    }

    // Process purchase
    ticket.availability -= 1;

    // Create purchase record
    const purchaseRecord = {
        purchaseId: Math.floor(Math.random() * 1000000),
        userId: userId,
        ticketId: ticketId,
        route: ticket.route,
        price: ticket.price,
        purchaseDate: new Date().toLocaleString()
    };

    // Store the purchase in local storage
    const purchases = JSON.parse(localStorage.getItem("purchases") || "[]");
    purchases.push(purchaseRecord);
    localStorage.setItem("purchases", JSON.stringify(purchases));

    // Display confirmation
    const confirmationMessage = `
        <div class="confirmation">
            <h3>Purchase Successful!</h3>
            <p><strong>Purchase ID:</strong> ${purchaseRecord.purchaseId}</p>
            <p><strong>Route:</strong> ${ticket.route}</p>
            <p><strong>Price:</strong> JMD ${ticket.price.toFixed(2)}</p>
            <p><strong>Date:</strong> ${purchaseRecord.purchaseDate}</p>
            <p>A confirmation has been sent to your registered email.</p>
        </div>
    `;

    document.getElementById("purchaseMessage").innerHTML = confirmationMessage;

    // Reset payment try count after successful purchase
    paymentTryCount = 0;
});

// Add back button to purchase form
document.getElementById("backToOptions").addEventListener("click", function () {
    displayOptions();
});

// Exit system
function exitSystem() {
    window.location.href = "dashboard.html";
}

// Initialize the system on page load
window.addEventListener("DOMContentLoaded", initializeSystem);