const express = require('express');
const router = express.Router();
const db = require('../database');
const { locationService } = require('../services/index')

// add a city to favorites
router.post('/addToFavorites', async (req, res) => {
    const { userId, cityKey } = req.query;

    console.log(`Attempting to add cityKey: ${cityKey} to favorites for userId: ${userId}`);

    try {
        let localizedName;
        const row = await new Promise((resolve, reject) => {
            db.get("SELECT localizedName FROM cities WHERE cityKey = ?", [cityKey], (err, row) => {
                if (err) {
                    console.error(`Error querying cities table for cityKey: ${cityKey}`, err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (row) {
            localizedName = row.localizedName;
            console.log(`Found localizedName: ${localizedName} in database for cityKey: ${cityKey}`);
        } else {
            console.log(`CityKey: ${cityKey} not found in database. Fetching from external API.`);
            localizedName = await locationService.fetchCityName(cityKey);

            await new Promise((resolve, reject) => {
                db.run("INSERT INTO cities (cityKey, localizedName) VALUES (?, ?)", [cityKey, localizedName], (insertErr) => {
                    if (insertErr) {
                        console.error(`Error inserting new cityKey: ${cityKey} into cities table`, insertErr);
                        reject(insertErr);
                    } else {
                        console.log(`New cityKey: ${cityKey} with localizedName: ${localizedName} added to cities table`);
                        resolve();
                    }
                });
            });
        }

        await new Promise((resolve, reject) => {
            db.run("INSERT INTO favorites (userId, cityKey, localizedName) VALUES (?, ?, ?)", [userId, cityKey, localizedName], (insertErr) => {
                if (insertErr) {
                    if (insertErr.code === 'SQLITE_CONSTRAINT') {
                        console.warn(`Duplicate entry for cityKey: ${cityKey} for userId: ${userId}. Not added to favorites.`);
                        reject('This city is already in favorites');
                    } else {
                        console.error(`Error inserting cityKey: ${cityKey} into favorites for userId: ${userId}`, insertErr);
                        reject('Failed to add to favorites');
                    }
                } else {
                    console.log(`CityKey: ${cityKey} added to favorites for userId: ${userId}`);
                    resolve();
                }
            });
        });

        res.status(201).send(`City - ${localizedName} with the id ${cityKey} added successfully to user ID - ${userId} favorites`);
    } catch (error) {
        console.error(`Failed operation for userId: ${userId} and cityKey: ${cityKey}`, error);
        res.status(500).send(error);
    }
});

// delete favorite cityID from user id
router.delete('/deleteFavorite/:cityID', (req, res) => {
    const cityID = req.params.cityID;
    const userId = req.query.userId;

    console.log(`Request to delete favorite: City ID ${cityID}, User ID ${userId}`);

    // Validate userId
    if (!userId) {
        console.warn(`Delete request missing userId for City ID ${cityID}`);
        return res.status(400).send('User ID is required');
    }

    const sql = 'DELETE FROM favorites WHERE cityKey = ? AND userId = ?';
    const params = [cityID, userId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(`Database error when deleting favorite: City ID ${cityID}, User ID ${userId}`, err);
            res.status(500).send(`Failed to delete favorite city with ID ${cityID} for user ${userId} due to an error: ${err.message}`);
            return;
        }
        if (this.changes === 0) {
            console.warn(`No favorite found to delete: City ID ${cityID}, User ID ${userId}`);
            res.status(404).send(`Favorite with ID city ${cityID} not found for user ${userId} in the favorites table`);
        } else {
            console.log(`Successfully deleted favorite: City ID ${cityID}, User ID ${userId}`);
            res.status(200).send(`Favorite with ID city ${cityID} deleted successfully for user ${userId} from the favorites table`);
        }
    });
});

// update favorites city ids in user id
router.put('/updateFavorites', async (req, res) => {
    const { userId, cityKeys } = req.query;

    if (!userId || !Array.isArray(cityKeys)) {
        console.warn(`Invalid request: Missing userId or cityKeys are not an array.`);
        return res.status(400).send('User ID and a list of city IDs are required');
    }

    console.log(`Received request to update favorites for User ID: ${userId} with city IDs: ${cityKeys.join(', ')}`);

    try {
        await db.run('BEGIN TRANSACTION');
        console.log(`Transaction started for updating favorites of User ID: ${userId}`);

        console.log(`Deleting existing favorites for User ID: ${userId}`);
        await db.run('DELETE FROM favorites WHERE userId = ?', [userId]);
        console.log('Done');

        console.log(`Inserting new favorites for User ID: ${userId}`);
        const insertSql = 'INSERT INTO favorites (userId, cityKey, localizedName) VALUES (?, ?, ?)';
        for (const cityKey of cityKeys) {
            const localizedName = await locationService.fetchCityName(cityKey);
            console.log(`Inserting city ID ${cityKey} with localizedName '${localizedName}' for User ID: ${userId}`);
            await db.run(insertSql, [userId, cityKey, localizedName]);
        }

        await db.run('COMMIT');
        console.log(`Favorites successfully updated for User ID: ${userId}`);
        res.status(200).send('Favorites updated successfully');
    } catch (error) {
        console.error(`Error occurred while updating favorites for User ID: ${userId}:`, error);
        await db.run('ROLLBACK');
        console.log(`Transaction rolled back due to error for User ID: ${userId}`);
        res.status(500).send('Failed to update favorites');
    }
});

router.post('/addUser', (req, res) => {
    const { userId, name } = req.query;
  
    // Check if userId exists
    db.get("SELECT userId FROM user WHERE userId = ?", [userId], (err, row) => {
      if (err) {
        res.status(500).send("Error checking user existence");
        return;
      }
  
      if (row) {
        res.status(400).send(`User ${name} userId - ${userId} already exists`);
      } else {
        // Insert new user
        db.run("INSERT INTO user (userId, name) VALUES (?, ?)", [userId, name], (insertErr) => {
          if (insertErr) {
            res.status(500).send("Error adding user");
          } else {
            res.status(200).send(`User ${name} added successfully`);
          }
        });
      }
    });
});

router.get('/getUser/:userId', (req, res) => {
    const { userId } = req.params;
  
    db.get("SELECT * FROM user WHERE userId = ?", [userId], (err, row) => {
      if (err) {
        res.status(500).send("Error fetching user");
        return;
      }
  
      if (row) {
        res.status(200).json(row);
      } else {
        res.status(404).send("User not found");
      }
    });
});
module.exports = router;
