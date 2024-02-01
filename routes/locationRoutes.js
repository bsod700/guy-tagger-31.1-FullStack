const express = require('express');
const router = express.Router();
const { locationService } = require('../services/index');
const db = require('../database');

// Route to handle location search query - q parameter
router.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  try {
    const results = await locationService.autocompleteLocation(query);

    // Save each city to the database
    for (const city of results) {
      await locationService.insertCity(city.Key, city.LocalizedName);
    }

    res.json(results);
  } catch (error) {
    res.status(500).send('Error processing your request');
  }
});


// get city name from city key
router.get('/cityName/:cityKey', async (req, res) => {
  const cityKey = req.params.cityKey;
  console.log(`Request to fetch city name for cityKey: ${cityKey}`);

  db.get("SELECT localizedName FROM cities WHERE cityKey = ?", [cityKey], async (err, row) => {
    if (err) {
      console.error(`Database query error for cityKey: ${cityKey}`, err);
      res.status(500).send('Database query error');
      return;
    }

    if (row) {
      console.log(`City name found in the database for cityKey: ${cityKey}`);

      res.json({ localizedName: row.localizedName });
    } else {
      console.log(`City name not found in the database for cityKey: ${cityKey}`);

      try {
        console.log(`Fetched city name from AccuWeather API for cityKey: ${cityKey}`);
        const localizedName = await locationService.fetchCityName(cityKey);

        // Save the new city information to the database
        db.run("INSERT INTO cities (cityKey, localizedName) VALUES (?, ?)", [cityKey, localizedName], (insertErr) => {
          if (insertErr) {
            console.error('Error saving city to database:', insertErr);
          } else {
            console.log(`City information saved to the database for cityKey: ${cityKey}`);
          }
        });

        res.json({ localizedName });
      } catch (fetchErr) {
        console.error(`Failed to fetch city name for cityKey: ${cityKey}`, fetchErr);
        res.status(500).send('Failed to fetch city name');
      }
    }
  });
});


module.exports = router;
