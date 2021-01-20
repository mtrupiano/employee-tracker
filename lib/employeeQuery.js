
class EmployeeQuery {

    static queryForAllEmployees         = "SELECT * FROM employee";

    static queryForEmployeeByName       = "SELECT * FROM employee WHERE role_id = ?";

    static queryForAllManagers          = "SELECT * FROM employee \
                                            JOIN role ON employee.role_id=role.id \
                                            WHERE role.title = \"manager\"";

    static queryForEmployeesByManager   = "SELECT * FROM employee WHERE manager_id = ?";

    static queryForEmployeesByRole      = "SELECT * FROM employee WHERE role_id = ?";

    static queryForAllRoles             = "SELECT role.id, role.title AS Title, role.salary AS Salary, department.name AS Department \
                                            FROM role \
                                            JOIN department ON role.department_id=department.id";
}

module.exports = EmployeeQuery;