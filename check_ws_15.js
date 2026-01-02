const db = require('./MedEventa-main/db');
db.query('SELECT * FROM workshop WHERE evenement_id = 15', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    process.exit();
});
