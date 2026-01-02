const db = require('./MedEventa-main/db');
db.query('DESCRIBE communication', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.end(() => process.exit());
});
