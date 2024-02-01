const axios = require('axios');
const db = require('../database'); 


async function searchCity(city) {
    const apiKey = process.env.ACCUWEATHER_API_KEY;
    const url = `http://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${apiKey}&q=${city}`;
  
    try {
      const response = await axios.get(url);
      if (response.data && response.data.length > 0) {
        return response.data[0].Key; // Return the city key
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
}

async function fetchCityName(cityKey) {
    const apiKey = process.env.ACCUWEATHER_API_KEY;
    const url = `http://dataservice.accuweather.com/locations/v1/${cityKey}?apikey=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      return response.data.LocalizedName;
    } catch (error) {
      console.error('Error fetching city name:', error);
      throw error; 
    }
}

async function autocompleteLocation(query) {
    const apiKey = process.env.ACCUWEATHER_API_KEY;
    const url = `http://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${apiKey}&q=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url);
        return response.data; // array
    } catch (error) {
        console.error('Error fetching location autocomplete data:', error);
        return [];
    }
}

module.exports = {
    fetchCityName,
    searchCity,
    autocompleteLocation
};