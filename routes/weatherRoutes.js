const express = require('express');
const router = express.Router();
const { weatherService } = require('../services/index');

router.get('/current/:cityKey', async (req, res) => {
    try {
      const cityKey = req.params.cityKey;
      const weather = await weatherService.getCurrentWeather(cityKey);
      res.json(weather);
    } catch (error) {
      res.status(500).send(error.message);
    }
});
  

module.exports = router;
