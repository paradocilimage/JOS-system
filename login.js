// Variables to track failed login attempts and assigned user IDs
let failedAttemptsCounter = 0;
const assignedIds = [];

// Slow down the background video playback speed
const video = document.getElementById('backgroundVideo');
if (video) {
    video.playbackRate = 0.6;
}

// Get references to the login form
const loginForm = document.getElementById('loginForm');

// Generate a unique User ID
function generateUniqueUserId() {
    let newId;
    do {
        newId = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    } while (assignedIds.includes(newId));
    assignedIds.push(newId);
    return newId;
}

// Validate user credentials
function validateCredentials(username, password) {
    // Retrieve stored user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(u => u.username === username && u.password === password) || null;
}

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form from refreshing the page

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const user = validateCredentials(username, password);

        if (user) {
            // Assign unique user ID if not already assigned
            if (!user.userId) {
                user.userId = generateUniqueUserId();
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const updatedUsers = users.map(u => (u.username === username ? user : u));
                localStorage.setItem('users', JSON.stringify(updatedUsers));
            }

            // Save user details in session storage
            sessionStorage.setItem('loggedInUser', JSON.stringify({
                fullName: `${user.firstName} ${user.lastName}`,
                username: user.username,
                userId: user.userId
            }));

            // Display success message and redirect to dashboard
            const message = document.getElementById('message');
            message.textContent = 'Login successful! Redirecting to your dashboard...';
            message.style.color = 'green';

            console.log('Redirecting to dashboard.html in 2 seconds...'); 

            setTimeout(() => {
                // Redirect to dashboard 
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            // Increment failed login attempt counter
            failedAttemptsCounter++;
            const message = document.getElementById('message');
            message.textContent = `Login Failed. Attempt ${failedAttemptsCounter} of 3.`;
            message.style.color = 'red';

            // Redirect to error page after 3 failed attempts
            if (failedAttemptsCounter >= 3) {
                message.textContent = 'Too many failed attempts. Redirecting to error page...';
                setTimeout(() => {
                    window.location.href = 'error.html'; // Redirect to error page
                }, 2000);
                failedAttemptsCounter = 0; // Reset counter
            }
        }
    });
}

// Function to delete all stored data (for testing purposes)
function deleteItems() {
    localStorage.clear();
    sessionStorage.clear(); // Also clear session storage
    console.log('All items in localStorage and sessionStorage have been deleted.');
}