const { Client } = require('pg');
module.exports = async (queryTxt) => {
    let dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    await dbClient.connect();
    const ret = await dbClient.query(queryTxt);
    await dbClient.end();
    return ret;
};