CREATE DATABASE myOutfits;
USE myOutfits;
CREATE TABLE categories (id INT AUTO_INCREMENT, occasion VARCHAR(50), colour VARCHAR(50), budget DECIMAL(5,2) unsigned, PRIMARY KEY(id));
INSERT INTO categories (occasion, colour, budget)VALUES('Casual', 'Red', 80.00),( 'Formal', 'Brown', 120.0), ('Casual', 'Green', 80.00);
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'outfit' ;
GRANT ALL PRIVILEGES ON myOutfits.* TO 'appuser'@'localhost';