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

const insertCity = async (cityKey, localizedName) => {
  const checkSql = 'SELECT cityKey FROM cities WHERE cityKey = ?';
  const checkParams = [cityKey];

  const insertSql = 'INSERT INTO cities (cityKey, localizedName) VALUES (?, ?)';
  const insertParams = [cityKey, localizedName];

  // Check if the cityKey already exists in the database
  const existingCity = await new Promise((resolve, reject) => {
    db.get(checkSql, checkParams, (err, row) => {
      if (err) {
        console.error('Error checking cityKey in the database:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

  if (existingCity) {
    console.log(`City with cityKey ${cityKey} already exists in the database`);
    return; // City already exists, do not insert
  }

  // City does not exist, insert it into the database
  return new Promise((resolve, reject) => {
    db.run(insertSql, insertParams, function (err) {
      if (err) {
        console.error('Error inserting city into the database:', err);
        reject(err);
      } else {
        console.log(`City with cityKey ${cityKey} inserted into the database`);
        resolve();
      }
    });
  });
};



module.exports = {
    fetchCityName,
    searchCity,
    autocompleteLocation,
    insertCity
};