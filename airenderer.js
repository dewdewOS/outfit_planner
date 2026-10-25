const { ipcRenderer } = require("electron");

const API_KEY = 'ab67d8636a9efab54a09d9eb8a671889';

const CITY = 'Chennai';


const wardrobe = require("./wardrobe.js");


const weatherElement = document.getElementById("weather");
const weatherDetailsElement =
    document.getElementById("weatherDetails");

const outfitElement =
    document.getElementById("outfit");

const recommendationElement =
    document.getElementById("recommendation");

const styleReasonElement =
    document.getElementById("styleReason");

const loadingElement =
    document.getElementById("loading");

const tryAgainButton =
    document.getElementById("tryAgainButton");


async function getWeather() {
    try {

        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Weather API returned status " + response.status
            );
        }

        const data = await response.json();

        const weather = {
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            condition: data.weather[0].main,
            description: data.weather[0].description
        };

        displayWeather(weather);

        return weather;

    } catch (error) {

        console.error("Weather error:", error);

        weatherElement.textContent =
            "Unable to fetch weather.";

        weatherDetailsElement.textContent =
            "Please check your internet connection or API key.";

        throw error;
    }
}


function displayWeather(weather) {

    weatherElement.textContent =
        `${weather.temperature.toFixed(1)}°C - ${weather.description}`;

    weatherDetailsElement.textContent =
        `Feels like ${weather.feelsLike.toFixed(1)}°C | ` +
        `Humidity ${weather.humidity}% | ` +
        `Wind ${weather.windSpeed} m/s`;
}


async function getRecommendation(weather) {

    loadingElement.style.display = "block";

    outfitElement.innerHTML = "";
    recommendationElement.textContent = "";
    styleReasonElement.textContent = "";

    try {

        const result = await ipcRenderer.invoke(
            "get-ai-recommendation",
            {
                weather: weather,
                wardrobe: wardrobe
            }
        );

        displayRecommendation(result);

    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );

        recommendationElement.textContent =
            "Could not create an AI recommendation.";

        styleReasonElement.textContent =
            "Please try again.";

    } finally {

        loadingElement.style.display = "none";
    }
}


function displayRecommendation(result) {

    if (result.outfit && result.outfit.length > 0) {

        result.outfit.forEach(item => {

            const card =
                document.createElement("div");

            card.className = "outfit-card";

            card.innerHTML = `
        <h3>${item.name}</h3>

        <p class="outfit-item">
          <strong>Category:</strong>
          ${item.category}
        </p>

        <p class="outfit-item">
          <strong>Color:</strong>
          ${item.color}
        </p>

        <p class="outfit-item">
          <strong>Style:</strong>
          ${item.style.join(", ")}
        </p>
      `;

            outfitElement.appendChild(card);
        });
    }

    if (result.recommendation) {
        recommendationElement.textContent =
            result.recommendation;
    }

    if (result.reason) {
        styleReasonElement.textContent =
            result.reason;
    }
}


tryAgainButton.addEventListener(
    "click",
    async () => {

        try {

            tryAgainButton.disabled = true;

            const weather = await getWeather();

            await getRecommendation(weather);

        } catch (error) {

            console.error(error);

        } finally {

            tryAgainButton.disabled = false;
        }
    }
);

async function startRecommendations() {

    try {

        const weather = await getWeather();

        await getRecommendation(weather);

    } catch (error) {

        console.error(
            "Could not start recommendation system:",
            error
        );
    }
}

startRecommendations();