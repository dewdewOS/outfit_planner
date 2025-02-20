const API_KEY = 'ab67d8636a9efab54a09d9eb8a671889';  // Replace with your OpenWeatherMap API key  
const CITY = 'Chennai';  // Change this to your city  

async function getWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        const temperature = data.main.temp;

        document.getElementById('weather').textContent = `Current Temperature: ${temperature}°C`;

        let recommendation = temperature < 20 ? "Wear a jacket 🧥" : "Wear a shirt 👕";
        document.getElementById('recommendation').textContent = recommendation;

    } catch (error) {
        document.getElementById('weather').textContent = "Error fetching weather data.";
    }
}

getWeather();