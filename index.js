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
                console.table(
                    result.map( 
                        emp => ( { Name: emp.Name, Title: emp.Title, Manager: emp.Manager } )
                    )
                );
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
            await removeEmployee();
            break;

        case "Update employee role":
            await updateEmployeeRole();
            exiter();
            break;
        case "Update employee manager":
            await updateEmployeeMngr();
            exiter();
            break;
        

        case "View roles":
            connection.query(queries.queryForAllRoles, function (err, result, fields) {
                if (err) throw err;
                console.table( 
                    result.map( 
                        role => ({ Title: role.Title, Salary: role.Salary, Department: role.Department }) 
                    )
                );
                exiter();
            });

        case "Exit":
            connection.end();
            return;
    }

}

async function updateEmployeeRole() {
    const [employees, fields] = await connection.promise().query(queries.queryForAllEmployees);

    const employeeSelect = await inquirer.prompt({
        type: "list",
        message: "Select employee to re-assign role:",
        name: "selection",
        choices: employees.map(emp => ({ value: emp.id, name: `${emp.Name} (role: ${emp.Title}, manager: ${emp.Manager})` }))
    });

    selectedEmployee = employees.find(e => e.id === employeeSelect.selection);

    const [roles, fields2] = await connection.promise().query(queries.queryForAllRoles);

    const roleSelect = await inquirer.prompt({
        type: "list",
        message: "Select new role:",
        name: "selection",
        choices: roles.map(role => ({ value: role.id, name: role.Title }))
    });

    const confirm = await inquirer.prompt({
        type: "confirm",
        message: "Confirm ROLE UPDATE for employee: " +
            selectedEmployee.Name +
            " ( " + selectedEmployee.Title + " --> " +
            roles.find(e => e.id === roleSelect.selection).Title + " )",
        name: "confirm"
    });

    if (confirm.confirm) {
        await connection
            .promise()
            .query("UPDATE employee SET role_id = ? WHERE id = ?", [roleSelect.selection, employeeSelect.selection]);
    } else {
        console.log("UPDATE operation aborted.")
    }

}

async function updateEmployeeMngr() {
    const [employees, fields] = await connection.promise().query(queries.queryForAllEmployees);

    const employeesNoMngrs = employees.filter( e => e.role_id !== 1)

    const employeeSelect = await inquirer.prompt({
        type: "list",
        message: "Select employee to re-assign manager:",
        name: "selection",
        choices: employeesNoMngrs.map(
            emp => ({ value: emp.id, name: `${emp.Name} (role: ${emp.Title}, manager: ${emp.Manager})` })
        )
    });

    selectedEmployee = employees.find(e => e.id === employeeSelect.selection);

    const [mngrs, fields2]
        = await connection
            .promise()
            .query(queries.queryForAllManagers);


    const indexOfManager = mngrs.findIndex(e => e.id === selectedEmployee.manager_id);
    mngrs.splice(indexOfManager, 1);

    const mngrSelect = await inquirer.prompt({
        type: "list",
        message: "Select new manager:",
        name: "selection",
        choices: mngrs.map(
            mngr => ({ value: mngr.id, name: mngr.Name })
        )
    });

    const confirm = await inquirer.prompt({
        type: "confirm",
        message: "Confirm MANAGER UPDATE for employee: " +
            selectedEmployee.Name + " ( " +
            selectedEmployee.Manager + " --> " +
            mngrs[indexOfManager-1].Name + " )",
        name: "confirm"
    });

    if (confirm.confirm) {
        await connection
            .promise()
            .query("UPDATE employee SET manager_id = ? WHERE id = ?",
                [mngrSelect.selection, selectedEmployee.id]);
    } else {
        console.log("UPDATE operation aborted.");
    }
}

async function removeEmployee() {
    const [employees, fields] = 
        await connection.promise().query(queries.queryForAllEmployees);

    const employeeToRemove = await inquirer.prompt({
        type: "list",
        message:"Select an employee to remove",
        name: "selected",
        choices: employees.map( emp => ({ value: emp.id, name: emp.Name }) )
    });

    const employee = employees.find( e => e.id === employeeToRemove.selected );

    // Handle if employee is a manager
    if (employee.role_id === 1) {
        // Check if manager has any employees
        const [mngrsEmployees, fields] = 
            await connection
                    .promise()
                    .query("SELECT * FROM employee WHERE manager_id = ?", employee.id);
        
        if (mngrsEmployees.length > 0) {
            await confirmMngrDelete(employee);
            exiter();
            return;
        }
    }

    // Prompt user to confirm delete, inform them of permanent operation
    const confirmDelete = await inquirer.prompt({
        type: "confirm",
        message: "Confirm deleting employee: " + employee.Name + 
                    " (id #" + employee.id + ")\n  WARNING: THIS ACTION IS PERMANENT",
        name: "confirm"
    });

    if (confirmDelete.confirm) {
        await connection
            .promise()
            .query("DELETE FROM employee WHERE id = ?", employeeToRemove.selected);
    } else {
        console.log("REMOVE operation aborted.");
    }

    exiter();
}

async function confirmMngrDelete(mngr) {
    const [mngrsEmployees, fields]
        = await connection.promise().query(queries.queryForEmployeesByManager, mngr.id);

    const action = await inquirer.prompt({
        type: "list",
        message: "You are attempting to remove a manager who has employees.\n  " + 
                 "You must either move these employees to a new manager or REMOVE them.",
        name: "action",
        choices: [
            "REMOVE THIS MANAGER AND ALL OF THEIR EMPLOYEES",
            "GO BACK"
        ]
    });

    if (action.action === "REMOVE THIS MANAGER AND ALL OF THEIR EMPLOYEES") {
        console.table(`${mngr.Name.toUpperCase()}'S EMPLOYEES`, mngrsEmployees);

        const confirm = await inquirer.prompt({
            type: "confirm",
            message: "Are you sure? This action will remove " + mngr.Name + 
                " and all of their employees (listed above)." +
                "\n  WARNING: THIS ACTION IS PERMANENT",
            name: "confirm"
        });

        if (confirm.confirm) {
            await connection.promise().query("DELETE FROM employee WHERE manager_id=?", mngr.id);
            await connection.promise().query("DELETE FROM employee WHERE id = ?", mngr.id);
        } else {
            console.log("REMOVE operation aborted.");
        }
    } else {
        console.log("REMOVE operation aborted.");   
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
            "name": "role",
            "choices": roles.map( role => ({ value: role.id, name: role.Title }) )
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
            "choices": managers.map(
                mngr => ({ value: mngr.id, name: `${mngr.last_name}, ${mngr.first_name}` }) )
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

        inquirer.prompt({
            type:"list",
            message:"Select a role",
            name:"selectedRole",
            choices: result.map( val => ({ value: val.id, name: val.Title }) )
        }).then( (selection) => {

            connection.query(queries.queryForEmployeesByRole, selection.selectedRole,
                function (err, result, fields) {
                    if (err) throw err;
                    if (result.length === 0) {
                        console.log( "\n  NO EMPLOYEES FOUND IN THAT ROLE\n" );
                    } else {
                        console.table(result);
                    }
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
            name: "selectedManager",
            choices: result.map( 
                mngr => ({ value: mngr.id, name: mngr.Name }) 
            )
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
        type: "list",
        message: "Continue? (Selecting 'NO' will exit the program.)",
        name: "continue",
        choices: [ "YES", "NO" ]
    }).then( (answer) => {
        if (answer.continue === "YES") {
            main();
        } else {
            connection.end();
            return;
        }
    })
}