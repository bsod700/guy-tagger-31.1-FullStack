const express = require('express');
const app = express();
const cors = require('cors');

const { weatherRoutes, locationRoutes, userRoutes } = require('./routes/index')

require('dotenv').config();
app.use(express.json());
app.use(cors());

app.use('/api/weather', cors(), weatherRoutes);
app.use('/api/user', cors(), userRoutes);
app.use('/api/location', cors(), locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
