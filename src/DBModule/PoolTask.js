const { Pool } = require('pg');
module.exports = async (itemArr, queryTxt) => {
    const dbClient = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    for (const item of itemArr) {
        const ret = await dbClient.query(queryTxt, [item]);
    };
    await dbClient.end();
};