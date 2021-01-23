
class EmployeeQuery {

    static queryForAllEmployees         
        = "SELECT CONCAT(e1.last_name, ', ', e1.first_name) AS Name, \
            role.title AS Title, \
            department.name AS Department, department.id AS depID, \
            CASE  \
                WHEN e1.manager_id IS NULL \
                THEN \"N/A\" \
                ELSE CONCAT(e2.last_name, ', ', e2.first_name) \
            END AS Manager, \
            role.salary AS Salary,\
            e1.id AS id, e1.role_id AS role_id, e1.manager_id AS manager_id\
            FROM employee e1 \
            LEFT JOIN employee e2 ON e2.id = e1.manager_id \
            INNER JOIN role ON e1.role_id = role.id \
            LEFT JOIN department ON role.department_id = department.id";

    static queryForEmployeeByName 
        = "SELECT * FROM employee WHERE role_id = ?";

    static queryForAllManagers 
        = "SELECT employee.id, \
            CONCAT(employee.last_name, ', ', employee.first_name) AS Name, employee.role_id\
            FROM employee \
            JOIN role ON employee.role_id=role.id \
            WHERE role.title = \"manager\"";

    static queryForEmployeesByManager   
        = "SELECT CONCAT(employee.last_name, ', ', employee.first_name) AS Name, \
            role.title AS Title, employee.id\
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
        = "SELECT role.id, role.title AS Title, role.salary AS Salary, \
            department.name AS Department, department.id AS depID \
            FROM role \
            JOIN department ON role.department_id=department.id";
    
    static queryForRoleByDep
        = "SELECT role.id, role.title FROM role WHERE role.department_id = ?";

    static queryForManagerByEmployee
        = "SELECT * FROM employee WHERE id = ?";

    static queryForAllDepartments 
        = "SELECT department.name AS Department, department.id AS ID, \
            COUNT(employee.id) AS \'No. of Employees\',\
            SUM(role.salary) AS Budget \
            FROM employee\
            JOIN role ON employee.role_id = role.id\
            RIGHT JOIN department ON role.department_id = department.id\
            GROUP BY department.id";
}

module.exports = EmployeeQuery;