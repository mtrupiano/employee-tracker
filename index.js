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
                        emp => ({ 
                                    Name: emp.Name, 
                                    Title: emp.Title, 
                                    Salary: emp.Salary,
                                    Department: emp.Department,
                                    Manager: emp.Manager
                                })
                    )
                );
                exiter();
                
            });
            return;

        case "View employees by role":
            await viewEmployeesByRole();
            return;

        case "View employees by manager":
            await viewEmployeesByManager();
            return;

        case "Add employee":
            await addEmployee();
            exiter();
            return;
        case "Remove employee":
            await removeEmployee();
            exiter();
            return;

        case "Update employee role":
            await updateEmployeeRole();
            exiter();
            return;

        case "Update employee manager":
            await updateEmployeeMngr();
            exiter();
            return;

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
            return;

        case "View departments":
            connection.query(queries.queryForAllDepartments, function (err, result, fields) {
                if (err) throw err;
                console.table(result);
                exiter();
            });
            return;

        case "Add department":
            await addDepartment();
            exiter();
            return;

        case "Add role":
            await addRole();
            exiter();
            return;
        
        case "Remove role":
            await removeRole();
            exiter();
            return;

        case "Exit":
            connection.end();
            return;
    }

}

async function removeRole() {
    const [roles, fields] = 
        await connection.promise().query(queries.queryForAllRoles);

    const roleSelect = await inquirer.prompt({
        type: "list",
        message: "Select role to remove:",
        name: "selection",
        choices: roles.map( 
            role => ({ 
                        value: role.id, 
                        name: `${role.Title} (${role.Department})` 
                    })
        )
    });

    const selectedRole = roles.find( role => role.id === roleSelect.selection);
    const [employees, fields1] = 
        await connection.promise().query(queries.queryForEmployeesByRole, selectedRole.id);

    if (employees.length > 0) {
        
        const confirmRoleDelete = await inquirer.prompt({
            type: "list",
            message: "There are employees assigned to this role." + 
                " You must either assign these employees to a different role" + 
                " or REMOVE all employees assigned this role.",
            name: "selection",
            choices: ["REMOVE ALL EMPLOYEES ASSIGNED THIS ROLE", "GO BACK"]
        });
        
        if (confirmRoleDelete.selection === "GO BACK") {
            console.log("REMOVE operation aborted.");
            return;
        } else {
            console.table(employees);
            const finalConfirm = await inquirer.prompt({
                type: "confirm",
                message: "Are you sure? This action will remove the " + selectedRole.Title +
                    " role from the " + selectedRole.Department + " department as well as " +
                    "all of the employees currently assigned this role (listed above)." + 
                    "\n  WARNING: THIS ACTION IS PERMANENT AND CANNOT BE UNDONE!",
                name: "confirm"
            });

            if (finalConfirm.confirm) {
                await connection.promise().query("DELETE FROM employee WHERE role_id=?", selectedRole.id);
                await connection.promise().query("DELETE FROM role WHERE id = ?", selectedRole.id);
                console.log("\n  DELETED the " + 
                                selectedRole.Title + " role from the " + 
                                selectedRole.Department + " department." );
            } else {
                console.log("REMOVE operation aborted.");
            }
        }
    } else {

        const finalConfirm = await inquirer.prompt({
            type: "confirm",
            message: "Are you sure? This action will remove the " + selectedRole.Title +
                " role from the " + selectedRole.Department + " department." +
                "\n  WARNING: THIS ACTION IS PERMANENT AND CANNOT BE UNDONE!",
            name: "confirm"
        });

        if (finalConfirm.confirm) {
            await connection.promise().query("DELETE FROM role WHERE id = ?", selectedRole.id);
            console.log("\n  DELETED the " +
                selectedRole.Title + " role from the " +
                selectedRole.Department + " department.");
        } else {
            console.log("REMOVE operation aborted.");
        }
    }

}

async function addDepartment() {
    
    const depName = await inquirer.prompt({
        type: "input",
        message: "Enter new department name: ",
        name: "depName"
    });

    const confirmAdd = await inquirer.prompt({
        type: "confirm",
        message: "Confirm adding department: " + depName.depName,
        name: "confirm"
    });
        
    if (confirmAdd.confirm) {
        await connection
                .promise()
                .query("INSERT INTO department VALUES (DEFAULT, ?)", depName.depName);
    } else {
        console.log("Department ADD operation aborted.");
    }
}

async function addRole() {
    const [departments, fields] = await connection.promise().query(
        "SELECT * FROM department"
    );

    const response = await inquirer.prompt([{
        type: "input",
        message: "Enter new role title: ",
        name: "title"
    }, {
        type: "number",
        message: "Enter new role salary: ",
        name: "salary"
    }, {
        type: "list",
        message: "Select the department this role belongs to: ",
        name: "department",
        choices: departments.map( dep => ({ value: dep.id, name: dep.name }) )
    }]);

    await connection.promise().query(
        "INSERT INTO role VALUES (DEFAULT, ?, ?, ?)",
        [response.title, response.salary, response.department],
        function (err, result, fields) {
            if (err) throw err;
        }
    );
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
    const rolesInDepartment = roles.filter( e => e.depID === selectedEmployee.depID);

    const roleSelect = await inquirer.prompt({
        type: "list",
        message: "Select new role (in " + selectedEmployee.Department + " department):",
        name: "selection",
        choices: rolesInDepartment.map(role => ({ value: role.id, name: role.Title }))
    });

    const selectedRole = roles.find(e => e.id === roleSelect.selection);

    const confirm = await inquirer.prompt({
        type: "confirm",
        message: "Confirm ROLE UPDATE for employee: " +
            selectedEmployee.Name +
            " ( " + selectedEmployee.Title + " --> " +
            selectedRole.Title + " )",
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
    // Query for all employees
    const [employees, fields] = 
        await connection.promise().query(queries.queryForAllEmployees);

    // Prompt user to select an employee to remove
    const employeeToRemove = await inquirer.prompt({
        type: "list",
        message:"Select an employee to remove",
        name: "selected",
        choices: employees.map( emp => ({ value: emp.id, name: emp.Name }) )
    });

    const employee = employees.find( e => e.id === employeeToRemove.selected );

    // Check/handle if employee is a manager
    if (employee.role.Title === "manager") {
        // Check if manager has any employees
        const [mngrsEmployees, fields] = 
            await connection
                    .promise()
                    .query("SELECT * FROM employee WHERE manager_id = ?", employee.id);
        
        if (mngrsEmployees.length > 0) {
            await confirmMngrDelete(employee, mngrsEmployees);
            return;
        }
    }

    // Prompt user to confirm delete, inform them of permanent operation
    const confirmDelete = await inquirer.prompt({
        type: "confirm",
        message: "Confirm deleting employee: " + employee.Name + 
                    " (id #" + employee.id + 
                    ")\n  WARNING: THIS ACTION IS PERMANENT AND CANNOT BE UNDONE!",
        name: "confirm"
    });

    // Perform query or abort based on response to confirmation prompt
    if (confirmDelete.confirm) {
        await connection
            .promise()
            .query("DELETE FROM employee WHERE id = ?", employeeToRemove.selected);
    } else {
        console.log("REMOVE operation aborted.");
    }
}

// Helper function to handle deleting all employees attached to a manager
async function confirmMngrDelete(mngr, mngrsEmployees) {
    // Warn user that they have to delete all of the manager's employees if 
    // they want to delete the manager
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
        // Confirm and warn the user that the manager and all their employees
        // will be permanently removed
        console.table(`${mngr.Name.toUpperCase()}'S EMPLOYEES`, mngrsEmployees);

        const confirm = await inquirer.prompt({
            type: "confirm",
            message: "Are you sure? This action will remove " + mngr.Name + 
                " and all of their employees (listed above)." +
                "\n  WARNING: THIS ACTION IS PERMANENT AND CANNOT BE UNDONE!",
            name: "confirm"
        });

        // Perform queries or abort based on response to confirmation prompt
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

    const [departments, fields] = await connection.promise().query(
        "SELECT * FROM department"
    );

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
            "message": "Select the employee's department:",
            "name": "department",
            "choices": departments.map( dep => ({ value: dep.id, name: dep.name }) )
        }
    ]);

    // Get list of possible roles from the database
    const [roles, fields2] = await connection.promise().query(
        "SELECT * FROM role WHERE department_id = ?", newEmployee.department);
    
    if (roles.length === 0) {
        console.log("/n  There are no roles assigned to this department." +
            "Please create roles before adding employees to this department.");
        return;
    }

    const newRole = await inquirer.prompt({
        type: "list",
        message: "Select the employee's role:",
        name: "selection",
        choices: roles.map( role => ({ value: role.id, name: role.title }) )
    })

    const selectedRole = roles.find(e => e.id === newRole.selection);

    if (selectedRole.title === "manager") { 
        // New employee is a manager
        newEmployee["manager"] = null;
    } else {

        // New employee is not a manager; query database for list of managers and
        // present another prompt for user to select new employee's manager
        const [managers, fields] = 
            await connection.promise().query(
                "SELECT employee.id, employee.last_name, employee.first_name, \
                    department.name \
                FROM employee \
                JOIN role ON employee.role_id = role.id\
                JOIN department ON role.department_id = department.id \
                WHERE role.title = \'manager\'"
            );
        
        const manager = await inquirer.prompt({
            "type": "list",
            "message": "Select the employee's manager:",
            "name": "manager",
            "choices": managers.map(
                mngr => ({ value: mngr.id, name: `${mngr.last_name}, ${mngr.first_name} (${mngr.name})` }) )
        });

        newEmployee["manager"] = manager.manager;
    }

    // Insert new employee into database
    await connection
        .promise()
        .query("INSERT INTO employee VALUES (DEFAULT, ?, ?, ?, ?)", 
                Object.values(newEmployee));
}

function viewEmployeesByRole() {
    connection.query(
        "SELECT role.title AS Title, role.id, department.name AS Department\
        FROM role \
        JOIN department ON role.department_id = department.id", 
        function (err, result, fields) {
        if (err) throw err;

        inquirer.prompt({
            type:"list",
            message:"Select a role",
            name:"selectedRole",
            choices: result.map( val => ({ value: val.id, name: `${val.Title} (${val.Department})` }) )
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
                    if (result.length > 0) {
                        console.table(result);
                    } else {
                        console.log("\n  NO EMPLOYEES REPORT TO THIS MANAGER\n");
                    }
                    exiter();
                });

        });

    });
}

// Present a prompt to return to the main menu or exit the program
function exiter() {
    inquirer.prompt({
        type: "list",
        message: "Continue/exit?",
        name: "continue",
        choices: [ "MAIN MENU", "EXIT" ]
    }).then( (answer) => {
        if (answer.continue === "MAIN MENU") {
            main();
        } else {
            connection.end();
            return;
        }
    })
}