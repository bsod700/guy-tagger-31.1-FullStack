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
    res.json(results);
  } catch (error) {
    res.status(500).send('Error processing your request');
  }
});

router.get('/cityName/:cityKey', async (req, res) => {
  const cityKey = req.params.cityKey;

  // First, try to find the city in the database
  db.get("SELECT localizedName FROM cities WHERE cityKey = ?", [cityKey], async (err, row) => {
    if (err) {
      res.status(500).send('Database query error');
      return;
    }

    if (row) {
      // City found in database, return the localizedName
      res.json({ localizedName: row.localizedName });
    } else {
      // City not found, fetch from AccuWeather API
      try {
        const localizedName = await locationService.fetchCityName(cityKey);

        // Save the new city information to the database
        db.run("INSERT INTO cities (cityKey, localizedName) VALUES (?, ?)", [cityKey, localizedName], (insertErr) => {
          if (insertErr) {
            console.error('Error saving city to database:', insertErr);
          }
        });

        res.json({ localizedName });
      } catch (fetchErr) {
        res.status(500).send('Failed to fetch city name');
      }
    }
  });
});


module.exports = router;
