
DROP DATABASE IF EXISTS employees;
CREATE DATABASE employees;

USE employees;

CREATE TABLE department (
    id      INT         AUTO_INCREMENT,
    name    VARCHAR(30) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE role (
    id              INT         NOT NULL   AUTO_INCREMENT,
    title           VARCHAR(30) NOT NULL,
    salary          DECIMAL     NOT NULL,
    department_id   INT         NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT FK_RoleDepartment FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE employee (
    id          INT         AUTO_INCREMENT,
    first_name  VARCHAR(30) NOT NULL,
    last_name   VARCHAR(30) NOT NULL,
    role_id     INT         NOT NULL,
    manager_id  INT,
    PRIMARY KEY(id),
    CONSTRAINT FK_EmployeeRole      FOREIGN KEY (role_id)       REFERENCES role(id),
    CONSTRAINT FK_EmployeeManager   FOREIGN KEY (manager_id)    REFERENCES employee(id)
);