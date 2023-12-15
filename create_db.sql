CREATE DATABASE myOutfits;
USE myOutfits;
CREATE TABLE categories (id INT AUTO_INCREMENT, occasion VARCHAR(50), colour VARCHAR(50), budget DECIMAL(5,2) unsigned, PRIMARY KEY(id));
INSERT INTO categories (occasion, colour, budget)VALUES('Casual', 'Red', 80.00),( 'Formal', 'Brown', 120.0), ('Casual', 'Green', 80.00);
DROP USER 'appuser'@'localhost';
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'outfit' ;
GRANT ALL PRIVILEGES ON myOutfits.* TO 'appuser'@'localhost';
CREATE TABLE userdetails (username VARCHAR(50), first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, email VARCHAR(100) NOT NULL, hashedPassword VARCHAR(255) NOT NULL, PRIMARY KEY (username));
SELECT * FROM userdetails WHERE username = 'duplicate-username';
ALTER TABLE userdetails ADD UNIQUE KEY unique_username (username);
SELECT * FROM userdetails