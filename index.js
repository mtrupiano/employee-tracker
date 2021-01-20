const mysql     = require ('mysql');
const inquirer  = require ('inquirer');
const cTable    = require ('console.table');

const queries = require ('./lib/employeeQuery.js');

const mainPrompts = require('./json/mainPrompts.json');

const connection = mysql.createConnection({
    host: '192.168.1.24',
    port: 3306,
    user: 'newuser',
    password: 'G1g@sequelpass',
    database: 'employees'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
});

async function main() {

    const select = await inquirer.prompt(mainPrompts);

    switch (select) {
        case "View all employees":
            connection.query(queries.queryForAllEmployees(), function (err, result, fields) {
                cTable(result);
            });
            break;
        case "View employees by role":
            break;
    }
}