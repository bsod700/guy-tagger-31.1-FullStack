const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./weather.db', (err) => {
    if (err) {
      console.error('Error opening database', err);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });

// create tables if not exists
db.serialize(() => {
    // =====================
    // --- weather table ---
    // =====================
    db.run(`CREATE TABLE IF NOT EXISTS weather (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cityKey INTEGER,
            localizedName TEXT,
            weather_data TEXT,
            temperature REAL,
            weatherText TEXT,
            lastUpdated TIMESTAMP
        )`,

        [], (err) => {
            if (err) {
            console.error('Error creating weather table', err);
            } else {
            console.log('Weather table is ready');
            }
    })
    // =====================
    // --- favorites table ---
    // =====================
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        cityKey INTEGER,
        localizedName TEXT,
        UNIQUE(userId, cityKey)
    )`,

    [], (err) => {
        if (err) {
            console.error('Error creating favorites table', err);
        } else {
            console.log('favorites table is ready');
        }
    })
    // =====================
    // --- cities table ---
    // =====================
    db.run(`CREATE TABLE IF NOT EXISTS cities (
        cityKey INTEGER PRIMARY KEY,
        localizedName TEXT
    )`,

    [], (err) => {
        if (err) {
            console.error('Error creating cities table', err);
        } else {
            console.log('cities table is ready');
        }
    })
});

module.exports = db;
