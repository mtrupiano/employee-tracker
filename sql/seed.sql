INSERT INTO department VALUES 
    ( DEFAULT, "development" ),
    ( DEFAULT, "accounting" );

INSERT INTO role VALUES 
    ( DEFAULT, "manager", 130000, 1 ),
    ( DEFAULT, "manager", 110000, 2 ),
    ( DEFAULT, "engineer", 90000, 1 ),
    ( DEFAULT, "intern", 45000, 1 ),
    ( DEFAULT, "accountant", 70000, 2);

INSERT INTO employee VALUES 
    ( DEFAULT, "Joe",       "Rehfuss",  1, NULL ),
    ( DEFAULT, "MF",       	"DOOM",  	1, NULL ),
    ( DEFAULT, "Juice",     "WRLD",  	1, NULL ),
    ( DEFAULT, "Aslan",     "Ghodsian", 3, 1 ),
    ( DEFAULT, "Mark",      "Trupiano", 4, 1 ),
    ( DEFAULT, "Daniel",    "Sasser",   4, 2 ),
    ( DEFAULT, "Nolan",     "Stucky",   4, 2 ),
    ( DEFAULT, "Seinfeld", "Jerry", 2, NULL),
    ( DEFAULT, "Kramer", "Cosmo", 5, 8);