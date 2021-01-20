

class EmployeeQuery {

    static queryForAllEmployees () {
        return "SELECT * FROM employee"
    }

    static queryForEmployeeByName () {
        return "SELECT * FROM employee WHERE name = ?"
    }
}

module.exports = EmployeeQuery;