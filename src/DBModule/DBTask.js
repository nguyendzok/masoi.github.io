const { Client } = require('pg');
module.exports = (queryTxt) => {
    let dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    dbClient.connect();
    dbClient.query(queryTxt, (err, res) => {
        try {
            if (err) throw err;
            return res.rows;
        } catch (err) {
            console.log(err);
        }
    });
};