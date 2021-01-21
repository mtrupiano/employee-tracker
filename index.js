const mysql     = require ('mysql2');
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
    main();
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
            await addEmployee();
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

async function addEmployee() {

    // Get list of possible roles from the database
    const [roles, fields] = await connection.promise().query(queries.queryForAllRoles);

    // Prompt user to input new employee's name and role
    const newEmployee = await inquirer.prompt([
        {
            "type": "input",
            "message": "Employee's first name? ",
            "name": "first_name"
        }, {
            "type": "input",
            "message": "Employee's last name? ",
            "name": "last_name"
        }, {
            "type": "list",
            "message": "Select the employee's role:",
            "choices": roles.map((val) => {
                return {
                    "value": val.id,
                    "name": val.Title
                };
            }),
            "name": "role"
        }
    ]);

    if (newEmployee.role === 1) { // New employee is a manager
        newEmployee["manager"] = null;
    } else {

        // New employee is not a manager; query database for list of managers and
        // present another prompt for user to select new employee's manager
        const [managers, fields] = 
            await connection.promise().query("SELECT * FROM employee WHERE role_id = 1");
        
        const manager = await inquirer.prompt({
            "type": "list",
            "message": "Select the employee's manager:",
            "name": "manager",
            "choices": managers.map((val) => {
                return {
                    "value": val.id,
                    "name": `${val.last_name}, ${val.first_name}`
                }
            })
        });

        newEmployee["manager"] = manager.manager;
    }

    // Insert new employee into database
    await connection
        .promise()
        .query("INSERT INTO employee VALUES (DEFAULT, ?, ?, ?, ?)", 
                Object.values(newEmployee));
    
    exiter();
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