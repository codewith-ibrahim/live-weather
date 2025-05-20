document.addEventListener("DOMContentLoaded", function () {
  // dom elements
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const locationBtn = document.getElementById("location-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const weatherDisplay = document.getElementById("weather-display");
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");
  const celsiusBtn = document.getElementById("celsius-btn");
  const fahrenheitBtn = document.getElementById("fahrenheit-btn");

  // weather display element
  const locationEl = document.getElementById("location").querySelector("span");
  const dateTimeEl = document.getElementById("date-time");
  const weatherIcon = document.getElementById("weather-icon");
  const temperatureEl = document
    .getElementById("temperature")
    .querySelector(".temp-value");
  const weatherDesc = document.getElementById("weather-description");
  const feelsLikeEl = document.getElementById("feels-like");
  const humidityEl = document.getElementById("humidity");
  const windSpeedEl = document.getElementById("wind-speed");
  const uvIndexEl = document.getElementById("uv-index");
  const forecastItems = document.getElementById("forecast-items");
  const lastUpdatedEl = document.getElementById("last-updated");

  // app state
  let currentUnit = "celsius";
  let lastSearchedCity = "";
  let currentWeatherData = null;
  let refreshInterval;
  let timeUpdateInterval;

  // initialize app
  initApp();

  // Event Listener
  searchBtn.addEventListener("click", searchWeather);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") searchWeather();
  });

  locationBtn.addEventListener("click", getLocationWeather);
  refreshBtn.addEventListener("click", refreshWeather);

  celsiusBtn.addEventListener("click", function () {
    if (currentUnit !== "celcius") {
      toggleUnits("celcius");
    }
  });

  fahrenheitBtn.addEventListener("click", function () {
    if (currentUnit !== "fahrenheit") {
      toggleUnits("fahrenheit");
    }
  });

  // Functions

  function initApp() {
    updateTime();
    timeUpdateInterval = setInterval(updateTime, 1000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          getWeatherByCity("Karachi");
        }
      );
    } else {
      getWeatherByCity("Karachi");
    }
  }
  function updateTime() {
    const now = new Date();
    dateTimeEl.textContent = now.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  function searchWeather() {
    const city = searchInput.value.trim();
    if (city) {
      getWeatherByCity(city);
      searchInput.value = "";
    }
  }
  function getLocationWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          );
        },

        (error) => {
          showError("Please enable location access to use this feature");
        }
      );
    } else {
      showError("Your Browser Geolocation is not supported by your browser");
    }
  }
  function refreshWeather() {
    if (lastSearchedCity) {
      getWeatherByCity(lastSearchedCity);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          );
        },

        (error) => {
          showError("Could not refrsh data");
        }
      );
    }
  }
  function startAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
      refreshWeather();
    }, 900000);
  }

  // API Call
  async function getWeatherByCity(city) {
    showLoading();
    lastSearchedCity = city;

    try {
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=21480b77eb33ed197e62b8e6a1422a57`
      );

      if (!currentResponse.ok) {
        throw new Error("City not found");
      }

      const currentData = await currentResponse.json();
      console.log("Current Data:", currentData);

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=21480b77eb33ed197e62b8e6a1422a57`
      );

      const forecastData = await forecastResponse.json();
      console.log("Forecast Data:", forecastData);

      currentWeatherData = {
        current: currentData,
        forecast: forecastData,
      };

      updateWeatherDisplay(currentWeatherData);
      hideError();

      const now = new Date();
      lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;

      startAutoRefresh();
    } catch (error) {
      showError(error.message || "Failed to fetch weather data");
    } finally {
      hideLoading();
    }
  }
  async function getWeatherByCoords(lat, lon) {
    showLoading();

    try {
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=21480b77eb33ed197e62b8e6a1422a57`
      );
      const currentData = await currentResponse.json();
      console.log("current Response", currentData);

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=21480b77eb33ed197e62b8e6a1422a57`
      );

      const forecastData = await forecastResponse.json();
      console.log("Forecast Response", forecastData);

      currentWeatherData = {
        current: currentData,
        forecast: forecastData,
      };

      lastSearchedCity = currentData.name;
      //   updateWeatherDisplay(currentWeatherData);
      //   hideError();

      try {
        updateWeatherDisplay(currentWeatherData);
        hideError();
      } catch (err) {
        console.error("Error in updateWeatherDisplay:", err);
      }

      try {
        startAutoRefresh();
      } catch (err) {
        console.error("Error in startAutoRefresh:", err);
      }

      const now = new Date();
      lastUpdatedEl.textContent = `last updated: ${now.toLocaleTimeString()}`;

      startAutoRefresh();
    } catch (error) {
      showError("Failed to fetch weather data");
    } finally {
      hideLoading();
    }
  }
  function updateWeatherDisplay(data) {
    const current = data.current;
    const forecast = data.forecast;

    locationEl.textContent = `${current.name}, ${current.sys.country}`;

    weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;

    weatherIcon.alt = current.weather[0].description;

    updateTemperature(current.main.temp);
    weatherDesc.textContent = current.weather[0].description;

    if (currentUnit === "celcius") {
      feelsLikeEl.textContent = `${Math.round(current.main.feels_like)}°C`;
    } else {
      feelsLikeEl.textContent = `${Math.round(
        (current.main.feels_like * 9) / 5 + 32
      )}°F`;
    }

    humidityEl.textContent = `${current.main.humidity}%`;
    windSpeedEl.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;

    const uvIndex = Math.min(Math.floor(current.main.temp / 5), 10);
    uvIndexEl.textContent = uvIndex;

    updateForecast(forecast);

    weatherDisplay.style.display = "flex";
  }
  function updateForecast(forecastData) {
    // Clear previous forecast items
    forecastItems.innerHTML = "";

    // Group forecast by day
    const dailyForecasts = {};

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "numeric",
        day: "numeric",
      });

      if (!dailyForecasts[dayKey]) {
        dailyForecasts[dayKey] = {
          date: date,
          items: [],
        };
      }

      dailyForecasts[dayKey].items.push(item);
    });

    // Get the next 7 days
    const days = Object.keys(dailyForecasts).slice(0, 6);

    days.forEach((dayKey) => {
      const dayData = dailyForecasts[dayKey];
      const date = dayData.date;
      const dayItems = dayData.items;

      // Find the midday forecast (between 11am and 2pm) or use the first one
      let middayForecast =
        dayItems.find((item) => {
          const hour = new Date(item.dt * 1000).getHours();
          return hour >= 11 && hour <= 14;
        }) ||
        dayItems[Math.floor(dayItems.length / 2)] ||
        dayItems[0];

      const forecastItem = document.createElement("div");
      forecastItem.className = "forecast-item";

      forecastItem.innerHTML = `
                <div class="forecast-day">${date.toLocaleDateString("en-US", {
                  weekday: "short",
                })}</div>
                <div class="forecast-date">${date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${
                  middayForecast.weather[0].icon
                }.png" alt="${middayForecast.weather[0].description}">
                <div class="forecast-temp">${Math.round(
                  middayForecast.main.temp
                )}°</div>
                <div class="forecast-desc">${
                  middayForecast.weather[0].description
                }</div>
            `;

      forecastItems.appendChild(forecastItem);
    });
  }
  function toggleUnits(unit) {
    currentUnit = unit;

    if (unit === "celsius") {
      celsiusBtn.classList.add("active");
      fahrenheitBtn.classList.remove("active");
    } else {
      celsiusBtn.classList.remove("active");
      fahrenheitBtn.classList.add("active");
    }

    if (currentWeatherData) {
      const temp = currentWeatherData.current.main.temp;
      const feelsLike = currentWeatherData.current.main.feels_like;

      if (unit === "celsius") {
        temperatureEl.textContent = Math.round(temp);
        feelsLikeEl.textContent = `${Math.round(feelsLike)}°C`;

        document.querySelectorAll(".forecast-temp").forEach((el) => {
          const tempValue = parseInt(el.textContent);
          const tempC = Math.round(((tempValue - 32) * 5) / 9);
          el.textContent = `${tempC}°`;
        });
      } else {
        temperatureEl.textContent = Math.round((temp * 9) / 5 + 32);
        feelsLike.textContent = `${Math.round((feelsLike * 9) / 5 + 32)}°F`;

        document.querySelectorAll(".forecast-temp").forEach((el) => {
          const tempValue = parseInt(el.textContent);
          const tempF = Math.round((tempValue * 9) / 5 + 32);
          el.textContent = `${tempF}°`;
        });
      }

      document.querySelector(".temp-unit").textContent =
        unit === "celsius" ? "C" : "F";
    }
  }
  function updateTemperature(temp) {
    if (currentUnit === "celcius") {
      temperatureEl.textContent = Math.round(temp);
    } else {
      temperatureEl.textContent = Math.round((temp * 9) / 5 + 32);
    }
  }
  function showLoading() {
    loading.style.display = "flex";
    weatherDisplay.style.display = "none";
  }
  function hideLoading() {
    loading.style.display = "none";
  }
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    weatherDisplay.style.display = "none";
  }
  function hideError() {
    errorMessage.style.display = "none";
  }
});
