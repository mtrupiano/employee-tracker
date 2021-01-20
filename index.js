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
                exiter();
            });
            break;

        case "View employees by role":
            viewEmployeesByRole();
            break;
        case "View employees by manager":
            viewEmployeesByManager();
            break;

        case "Add employee":
            break;
        case "Remove employee":
            break;
        

        case "View roles":
            connection.query(queries.queryForAllRoles, function (err, result, fields) {
                if (err) throw err;
                console.table(result.map((val) => {
                    return { "Title": val.Title, "Salary": val.Salary, "Department": val.Department };
                }));
                exiter();
            });

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
                    exiter();
            });

        });

    });
}

function viewEmployeesByManager() {
    connection.query(queries.queryForAllManagers, function (err, result, fields) {
        if (err) throw err;

        inquirer.prompt({
            type: "list",
            message: "Select a manager",
            choices: result.map( (val) => { 
                                    return { 
                                        "value": val.id, 
                                        "name": `${val.first_name} ${val.last_name}` 
                                    }; 
                                }),
            name: "selectedManager"
        }).then((selection) => {

            connection.query(queries.queryForEmployeesByManager, selection.selectedManager,
                function (err, result, fields) {
                    if (err) throw err;
                    console.table(result);
                    exiter();
                });

        });

    });
}

function exiter() {
    inquirer.prompt({
        type: "confirm",
        message: "Run another command? ('n' will exit the program)",
        name: "continue"
    }).then( (answer) => {
        if (answer.continue) {
            main();
        } else {
            connection.end();
            return;
        }
    })
}

// Run the program
main();