document.getElementById('getWeatherBtn').addEventListener('click', function() {
    const cityName = document.getElementById('cityInput').value;
    const apiKey = '73ff60754b04c1622206d3578c75440f'; 

    // Geocoding API URL to get coordinates
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`;

    fetch(geoUrl)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Geocoding API request failed');
                });
            }
            return response.json();
        })
        .then(geoData => {
            if (geoData.length === 0) {
                throw new Error('City not found');
            }

            const { name, state, country, lat, lon } = geoData[0];

            // Current Weather Data API URL
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;

            // Forecast API URL
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;

            // Fetch current weather and forecast data concurrently
            return Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]).then(async ([currentResponse, forecastResponse]) => {
                if (!currentResponse.ok) {
                    const errData = await currentResponse.json();
                    throw new Error(errData.message || 'Current weather data request failed');
                }
                if (!forecastResponse.ok) {
                    const errData = await forecastResponse.json();
                    throw new Error(errData.message || 'Forecast data request failed');
                }

                const currentData = await currentResponse.json();
                const forecastData = await forecastResponse.json();

                // Display the data
                const weatherDisplay = document.getElementById('weatherDisplay');

                // Current weather
                const currentWeather = `
                    <p><strong>${name}${state ? ', ' + state : ''}, ${country}</strong></p>
                    <p>Current Temperature: ${currentData.main.temp} °F</p>
                    <p>Weather: ${currentData.weather[0].description}</p>
                    <p>Humidity: ${currentData.main.humidity}%</p>
                    <p>Wind Speed: ${currentData.wind.speed} m/s</p>
                `;

                // Forecast for the next 3 days with High and Low Temperatures
                let forecastHTML = '<h3>3-Day Forecast:</h3>';
                const forecastList = forecastData.list;

                // Function to group forecasts by date
                const groupedForecast = forecastList.reduce((acc, forecast) => {
                    const date = new Date(forecast.dt * 1000).toLocaleDateString();
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(forecast);
                    return acc;
                }, {});

                // Get the next 3 days excluding today
                const today = new Date().toLocaleDateString();
                const dates = Object.keys(groupedForecast).filter(date => date !== today).slice(0, 3);

                dates.forEach(date => {
                    const dailyForecasts = groupedForecast[date];
                    const temps = dailyForecasts.map(forecast => forecast.main.temp);
                    const descriptions = dailyForecasts.map(forecast => forecast.weather[0].description);
                    const humidities = dailyForecasts.map(forecast => forecast.main.humidity);
                    const windSpeeds = dailyForecasts.map(forecast => forecast.wind.speed);

                    const highTemp = Math.max(...temps).toFixed(1);
                    const lowTemp = Math.min(...temps).toFixed(1);

                    // Get the most frequent weather description
                    const description = mostFrequent(descriptions);

                    // Average humidity and wind speed
                    //const avgHumidity = (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1);
                    //const avgWindSpeed = (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(1);

                    forecastHTML += `
                        <div class="forecast-day">
                            <p><strong>${date}</strong></p>
                            <p>High: ${highTemp} °F, Low: ${lowTemp} °F</p>
                            <p>Weather: ${description}</p>
                        </div>
                    `;
                });

                weatherDisplay.innerHTML = currentWeather + forecastHTML;
            });
        })
        .catch(error => {
            document.getElementById('weatherDisplay').innerHTML = `<p style="color: red;">${error.message}</p>`;
        });

    /**
     * Helper function to find the most frequent item in an array
     * @param {Array} arr - Array of items
     * @returns {String} - Most frequent item
     */
    function mostFrequent(arr) {
        const frequency = {};
        let max = 0;
        let result = arr[0];

        for (const item of arr) {
            frequency[item] = (frequency[item] || 0) + 1;
            if (frequency[item] > max) {
                max = frequency[item];
                result = item;
            }
        }

        return result;
    }
});
