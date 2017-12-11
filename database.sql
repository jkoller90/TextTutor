create database db;
use db; 
drop database db; 


use sql9209858; 

CREATE TABLE test(
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `address` int(11) NOT NULL,
  `phone` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `test` (`id`, `name`, `address`, `phone`) VALUES
(1, 'Person 1', 310, 821),
(2, 'Person 2', 311, 852),
(3, 'Person 3', 312, 853),
(4, 'Person 4', 313, 854),
(5, 'Person 5', 314, 855);

select * from test; 

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

