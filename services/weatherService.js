const axios = require('axios');
const db = require('../database'); 


async function fetchWeather(cityKey) {
    const apiKey = process.env.ACCUWEATHER_API_KEY;
    const url = `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      console.log('fetchWeather response');

      const weatherData = response.data[0];
  
      // Extract and return only the necessary data
      // Adjust the following line according to the actual structure of the response
      return {
        temperature: weatherData.Temperature.Metric.Value,
        weatherText: weatherData.WeatherText
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
}

async function getCurrentWeather(cityKey) {
    const maxTime = 3600000  // 1 hour threshold
    // Check if the current weather for this city is already in the database
    const result = await new Promise((resolve, reject) => {
      db.get(`SELECT temperature, weatherText, lastUpdated FROM weather WHERE cityKey = ?`, [cityKey], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  
    // If weather data exists and is recent, return it
    if (result && new Date() - new Date(result.lastUpdated) < maxTime) {
        return result;
    }
  
    // Otherwise, fetch new weather data from AccuWeather
    const weatherData = await fetchWeather(cityKey);

    if (weatherData) {
        const { temperature, weatherText } = weatherData;
  
    // Save the new data to the database
    await new Promise((resolve, reject) => {
        db.run(`INSERT INTO weather (cityKey, temperature, weatherText, lastUpdated) VALUES (?, ?, ?, ?)`, 
          [cityKey, temperature, weatherText, new Date()], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  
        return { temperature, weatherText: weatherText };
    } else {
        throw new Error('Unable to fetch weather data');
    }
}

module.exports = {
    fetchWeather,
    getCurrentWeather
};