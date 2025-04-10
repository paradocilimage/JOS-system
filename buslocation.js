
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the system
    initializeBusTracker();
});

// Bus data storage
const busMarkers = {};
let currentBusId = null;
let refreshTimer = null;
const updateInterval = 30000; // 30 seconds

// Bus routes data from tickets
const busRoutes = [
    { busId: "JB1001", ticketId: 101, route: "Kingston to Montego Bay", price: 250, status: "ACTIVE" },
    { busId: "JB1002", ticketId: 102, route: "Ocho Rios to Kingston", price: 220, status: "ACTIVE" },
    { busId: "JB1003", ticketId: 103, route: "Montego Bay to Negril", price: 180, status: "DELAYED" },
    { busId: "JB1004", ticketId: 104, route: "Halfway Tree to Downtown Kingston", price: 120, status: "ACTIVE" },
    { busId: "JB1005", ticketId: 105, route: "Downtown Kingston to Halfway Tree", price: 120, status: "ACTIVE" },
    { busId: "JB1006", ticketId: 106, route: "Halfway Tree to Spanish Town", price: 150, status: "ACTIVE" },
    { busId: "JB1007", ticketId: 107, route: "Spanish Town to Halfway Tree", price: 150, status: "DELAYED" },
    { busId: "JB1008", ticketId: 108, route: "Spanish Town to May Pen", price: 180, status: "ACTIVE" },
    { busId: "JB1009", ticketId: 109, route: "May Pen to Spanish Town", price: 180, status: "ACTIVE" },
    { busId: "JB1010", ticketId: 110, route: "Kingston to Port Antonio", price: 230, status: "OUT_OF_SERVICE" },
    { busId: "JB1011", ticketId: 111, route: "Port Antonio to Kingston", price: 230, status: "ACTIVE" }
];

// Jamaica GPS coordinates (center point)
const jamaicaCenter = [18.1096, -77.2975];

// Bus locations mapping for simulation
const busLocations = {
    // Kingston area
    "Kingston": [18.0179, -76.8099],
    "Halfway Tree": [18.0114, -76.7994],
    "Downtown Kingston": [17.9942, -76.7944],

    // Other major locations
    "Montego Bay": [18.4762, -77.9186],
    "Ocho Rios": [18.4162, -77.1167],
    "Negril": [18.2569, -78.3493],
    "Spanish Town": [18.0092, -77.0041],
    "May Pen": [17.9714, -77.2429],
    "Port Antonio": [18.1851, -76.4604]
};

// DOM elements
let map;
let busIdInput;
let trackBtn;
let busInfoPanel;
let refreshControls;
let autoRefreshBtn;
let stopRefreshBtn;

/**
 * Initialize the bus tracker system
 */
function initializeBusTracker() {
    console.log("Jamaican Bus Location Tracker Initialized");

    // Initialize map component
    initializeMap();

    // Initialize UI references
    busIdInput = document.getElementById('bus-id');
    trackBtn = document.getElementById('track-btn');
    busInfoPanel = document.getElementById('bus-info');
    refreshControls = document.getElementById('refresh-controls');
    autoRefreshBtn = document.getElementById('auto-refresh-btn');
    stopRefreshBtn = document.getElementById('stop-refresh-btn');

    // Set up event listeners
    setupEventListeners();

    // Update route list in the UI
    updateRouteList();
}

/**
 * Initialize the map using Leaflet
 */
function initializeMap() {
    // Create map instance centered on Jamaica
    map = L.map('map').setView(jamaicaCenter, 9);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

/**
 * Update the list of available routes in the UI
 */
function updateRouteList() {
    const routeList = document.querySelector('.route-list');
    routeList.innerHTML = '';

    busRoutes.forEach(bus => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${bus.busId}</strong> - ${bus.route}`;
        routeList.appendChild(listItem);
    });
}

/**
 * Set up all event listeners for the tracker
 */
function setupEventListeners() {
    // Track button click
    trackBtn.addEventListener('click', trackBus);

    // Auto-refresh controls
    autoRefreshBtn.addEventListener('click', startAutoRefresh);
    stopRefreshBtn.addEventListener('click', stopAutoRefresh);

    // Enter key on bus ID input
    busIdInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            trackBus();
        }
    });

    // Make the route list items clickable
    setTimeout(() => {
        document.querySelectorAll('.route-list li').forEach(item => {
            item.addEventListener('click', function () {
                const busId = this.querySelector('strong').textContent;
                busIdInput.value = busId;
                trackBus();
            });
            item.style.cursor = 'pointer';
        });
    }, 100);
}

/**
 * Track a bus based on user input
 */
function trackBus() {
    const busId = busIdInput.value.trim();

    // Validate input
    if (!busId) {
        alert("Please enter a valid Bus ID");
        return;
    }

    currentBusId = busId;

    // Request bus location data
    const busLocation = requestBusLocationData(busId);

    if (busLocation) {
        // Display the bus on map
        displayBusOnMap(busId, busLocation);

        // Update information panel
        updateBusInformationPanel(busId, busLocation);

        // Show the info panel and refresh controls
        busInfoPanel.classList.remove('hidden');
        refreshControls.classList.remove('hidden');

        // Start auto-refresh
        startAutoRefresh();
    } else {
        alert("Bus location data unavailable. The bus may not be in service or ID is invalid.");
        busInfoPanel.classList.add('hidden');
        refreshControls.classList.add('hidden');
        stopAutoRefresh();
    }
}

/**
 * Request bus location data from the service
 * @param {string} busId - The ID of the bus to track
 * @returns {Object|null} - Bus location data or null if unavailable
 */
function requestBusLocationData(busId) {
    // Find the bus in our routes data
    const bus = busRoutes.find(b => b.busId === busId);

    if (!bus) {
        return null;
    }

    // Parse route to determine current location and next stop
    const routeParts = bus.route.split(' to ');
    const currentLocation = routeParts[0];
    const nextStop = routeParts[1];

    // Get coordinates for current location
    const coordinates = busLocations[currentLocation] || jamaicaCenter;

    // Add some randomness to bus location for simulation
    const lat = coordinates[0] + (Math.random() * 0.02 - 0.01);
    const lng = coordinates[1] + (Math.random() * 0.02 - 0.01);

    // Calculate arrival time based on status
    let arrivalTime;
    if (bus.status === "ACTIVE") {
        arrivalTime = Math.floor(Math.random() * 15) + 5 + " min";
    } else if (bus.status === "DELAYED") {
        arrivalTime = Math.floor(Math.random() * 20) + 15 + " min (delayed)";
    } else {
        arrivalTime = "Not in service";
    }

    // Generate a street address based on location
    const streetAddress = generateStreetAddress(currentLocation);

    return {
        streetAddress: streetAddress,
        timestamp: new Date().toLocaleString(),
        nextStop: nextStop,
        route: bus.route,
        status: bus.status,
        coordinates: [lat, lng],
        arrivalTime: arrivalTime,
        price: bus.price,
        ticketId: bus.ticketId
    };
}

/**
 
 * @param {string} location - The location name
 * @returns {string} - A simulated street address
 */
function generateStreetAddress(location) {
    const streets = {
        "Kingston": ["Hope Road", "Half Way Tree Road", "Old Hope Road", "Lady Musgrave Road"],
        "Halfway Tree": ["Constant Spring Road", "Hagley Park Road", "Maxfield Avenue"],
        "Downtown Kingston": ["King Street", "Port Royal Street", "Ocean Boulevard", "Marcus Garvey Drive"],
        "Montego Bay": ["Gloucester Avenue", "St. James Street", "Queens Drive"],
        "Ocho Rios": ["Main Street", "DaCosta Drive", "Turtle Beach Road"],
        "Negril": ["Norman Manley Boulevard", "West End Road"],
        "Spanish Town": ["Burke Road", "Wellington Street", "Young Street"],
        "May Pen": ["Main Street", "Chapelton Road", "Manchester Avenue"],
        "Port Antonio": ["Harbour Street", "West Street", "Fort George Street"]
    };

    const streetList = streets[location] || ["Main Road"];
    const street = streetList[Math.floor(Math.random() * streetList.length)];
    const buildingNumber = Math.floor(Math.random() * 100) + 1;

    return `${buildingNumber} ${street}, ${location}`;
}

/**
 * Display a bus on the map
 * @param {string} busId - The ID of the bus
 * @param {Object} locationData - Location data for the bus
 */
function displayBusOnMap(busId, locationData) {
    // Remove previous marker if exists
    if (busMarkers[busId]) {
        map.removeLayer(busMarkers[busId]);
    }

    // Create bus icon with color based on status
    let iconColor = "#2e7d32"; // default green for active
    if (locationData.status === "DELAYED") {
        iconColor = "#e65100"; // orange for delayed
    } else if (locationData.status === "OUT_OF_SERVICE") {
        iconColor = "#c62828"; // red for out of service
    }

    const busIcon = L.divIcon({
        html: `<div class="bus-icon" style="background-color: ${iconColor};">${busId.replace('JB', '')}</div>`,
        className: 'bus-marker',
        iconSize: [40, 40]
    });

    // Create new marker
    const marker = L.marker(locationData.coordinates, { icon: busIcon })
        .addTo(map)
        .bindPopup(`
            <strong>Bus ${busId}</strong><br>
            Route: ${locationData.route}<br>
            Next Stop: ${locationData.nextStop}<br>
            Status: ${locationData.status}<br>
            Ticket Price: $${locationData.price}
        `);

    // Store reference to marker
    busMarkers[busId] = marker;

    // Center map on the bus
    map.setView(locationData.coordinates, 12);
}

/**
 * Update the bus information panel with location data
 * @param {string} busId - The ID of the bus
 * @param {Object} locationData - Location data for the bus
 */
function updateBusInformationPanel(busId, locationData) {
    document.getElementById('info-id').textContent = busId;
    document.getElementById('info-location').textContent = locationData.streetAddress;
    document.getElementById('info-time').textContent = locationData.timestamp;
    document.getElementById('info-next-stop').textContent = locationData.nextStop;
    document.getElementById('info-route').textContent = locationData.route;
    document.getElementById('info-arrival').textContent = locationData.arrivalTime;

    // Create a new element for ticket information if it doesn't exist
    if (!document.getElementById('info-ticket')) {
        const ticketPara = document.createElement('p');
        ticketPara.innerHTML = `<strong>Ticket ID:</strong> <span id="info-ticket"></span>`;
        document.getElementById('bus-info').insertBefore(ticketPara, document.getElementById('bus-info').lastElementChild);

        const pricePara = document.createElement('p');
        pricePara.innerHTML = `<strong>Price:</strong> <span id="info-price"></span>`;
        document.getElementById('bus-info').insertBefore(pricePara, document.getElementById('bus-info').lastElementChild);
    }

    // Update ticket information
    document.getElementById('info-ticket').textContent = locationData.ticketId;
    document.getElementById('info-price').textContent = `$${locationData.price}`;

    // Update status with appropriate styling
    const statusElement = document.getElementById('info-status');
    statusElement.textContent = locationData.status;

    // Clear all status classes
    statusElement.className = 'status';

    // Add appropriate status class
    switch (locationData.status) {
        case 'ACTIVE':
            statusElement.classList.add('status-active');
            break;
        case 'DELAYED':
            statusElement.classList.add('status-delayed');
            break;
        case 'OUT_OF_SERVICE':
            statusElement.classList.add('status-out');
            break;
    }
}

/**
 * Start auto-refresh of bus location data
 */
function startAutoRefresh() {
    // Clear any existing timer
    stopAutoRefresh();

    // Start new timer
    refreshTimer = setInterval(function () {
        if (currentBusId) {
            const updatedLocation = requestBusLocationData(currentBusId);
            if (updatedLocation) {
                displayBusOnMap(currentBusId, updatedLocation);
                updateBusInformationPanel(currentBusId, updatedLocation);
            }
        }
    }, updateInterval);

    autoRefreshBtn.disabled = true;
    stopRefreshBtn.disabled = false;
}

/**
 * Stop auto-refresh of bus location data
 */
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    autoRefreshBtn.disabled = false;
    stopRefreshBtn.disabled = true;
}