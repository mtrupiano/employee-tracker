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

    switch (select.mainSelect) {
        case "View all employees":
            connection.query(queries.queryForAllEmployees, function (err, result, fields) {
                if (err) throw err;
                console.table(result);
                main();
            });
            break;
        case "View employees by role":
            viewEmployeesByRole();
            
            break;
        case "View employees by manager":
            break;
        

        case "View roles":
            connection.query(queries.queryForAllRoles, function (err, result, fields) {
                if (err) throw err;
                console.table(result);
                main();
            });
            break;

        case "Exit":
            connection.end();
            return;
    }

}

function viewEmployeesByRole() {
    connection.query(queries.queryForAllRoles, function (err, result, fields) {
        if (err) throw err;
        
        inquirer.prompt( {
            type:"list",
            message:"Select a role",
            choices: result.map( (val) => { return { "value": val.id, "name": val.Title }; } ),
            name:"selectedRole"
        } ).then( (selection) => {

            connection.query(queries.queryForEmployeesByRole, selection.selectedRole,
                function (err, result, fields) {
                    if (err) throw err;
                    console.table(result);
            });

        });

    });
}

// Run the program
main();