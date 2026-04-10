let isUsingOpenMeteo = true; // No API key required for Open-Meteo

// Theme Toggle Logic
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
} else {
    themeToggle.textContent = '🌙';
}

themeToggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});


function showError(msg) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.querySelector('p').textContent = msg;
    errorDiv.classList.remove('hidden');
    document.getElementById('weatherDisplay').classList.add('hidden');
}

function updateUI(data, city, country) {
    document.getElementById('errorMessage').classList.add('hidden');
    
    document.getElementById('cityName').textContent = `${city}, ${country}`;
    document.getElementById('temperature').textContent = `${Math.round(data.current_weather.temperature)}°C`;
    
    // Convert WMO code to description
    const wmoCode = data.current_weather.weathercode;
    let desc = "Clear";
    let icon = "01d";
    if (wmoCode >= 1 && wmoCode <= 3) { desc = "Partly Cloudy"; icon = "02d"; }
    if (wmoCode >= 45 && wmoCode <= 48) { desc = "Foggy"; icon = "50d"; }
    if (wmoCode >= 51 && wmoCode <= 67) { desc = "Rain"; icon = "09d"; }
    if (wmoCode >= 71 && wmoCode <= 77) { desc = "Snow"; icon = "13d"; }
    if (wmoCode >= 95) { desc = "Thunderstorm"; icon = "11d"; }
    
    document.getElementById('description').textContent = desc;
    document.getElementById('humidity').textContent = `${data.hourly.relativehumidity_2m[0]}%`;
    document.getElementById('windSpeed').textContent = `${data.current_weather.windspeed} km/h`;
    document.getElementById('pressure').textContent = `${data.hourly.surface_pressure[0]} hPa`;
    
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    document.getElementById('weatherDisplay').classList.remove('hidden');
}

async function fetchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;
    
    try {
        // Step 1: Geocoding (Convert city to lat/lon)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }
        
        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        const country = geoData.results[0].country || '';
        const name = geoData.results[0].name;

        // Step 2: Fetch Weather
        fetchWeatherDataForCoords(lat, lon, name, country);
    } catch (err) {
        showError(`Error: ${err.message}`);
    }
}

async function fetchWeatherDataForCoords(lat, lon, cityName = "Your Location", country = "") {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error("Failed to fetch weather data");
        }
        
        updateUI(data, cityName, country);
    } catch(err) {
        showError(`Error: ${err.message}`);
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherDataForCoords(position.coords.latitude, position.coords.longitude);
            },
            err => {
                showError('Location access disabled or failed.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Allow Enter key in search box
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchWeather();
    }
});
