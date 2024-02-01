const express = require('express');
const app = express();

const { weatherRoutes, locationRoutes, userRoutes } = require('./routes/index')

require('dotenv').config();
app.use(express.json());

app.use('/api/weather', weatherRoutes);
app.use('/api/favorites', userRoutes);
app.use('/api/location', locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
