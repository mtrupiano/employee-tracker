
class EmployeeQuery {

    static queryForAllEmployees         
        = "SELECT CONCAT(e1.last_name, ', ', e1.first_name) AS Name, \
            role.title AS Title, \
            CONCAT(e2.last_name, ', ', e2.first_name) AS Manager, e1.id AS id, e1.role_id AS role_id\
            FROM employee e1 \
            LEFT JOIN employee e2 ON e2.id = e1.manager_id \
            INNER JOIN role ON e1.role_id = role.id";

    static queryForEmployeeByName 
        = "SELECT * FROM employee WHERE role_id = ?";

    static queryForAllManagers 
        = "SELECT * FROM employee \
            JOIN role ON employee.role_id=role.id \
            WHERE role.title = \"manager\"";

    static queryForEmployeesByManager   
        = "SELECT CONCAT(employee.last_name, ', ', employee.first_name) AS Name, \
            role.title AS Title \
            FROM employee \
            JOIN role ON employee.role_id = role.id\
            WHERE employee.manager_id = ?";

    static queryForEmployeesByRole 
        = "SELECT CONCAT(e1.last_name, ', ', e1.first_name) AS Name, \
            CONCAT(e2.last_name, ', ', e2.first_name) AS Manager \
            FROM employee e1 \
            LEFT JOIN employee e2 ON e2.id = e1.manager_id \
            WHERE e1.role_id = ?";

    static queryForAllRoles 
        = "SELECT role.id, role.title AS Title, role.salary AS Salary, department.name AS Department \
            FROM role \
            JOIN department ON role.department_id=department.id";
}

module.exports = EmployeeQuery;