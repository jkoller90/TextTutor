create database sql9205093;
use sql9205093;


SET SQL_SAFE_UPDATES = 0;

CREATE TABLE class (
  id mediumint(8) unsigned NOT NULL auto_increment,
  phonenumber varchar(100) default NULL,
  hasQuizStarted boolean default false,
  answer varchar(300) default NULL,
  answeredCorrectly boolean default false,
  hasTakenQuiz boolean default false,
  PRIMARY KEY (`id`)
) AUTO_INCREMENT=1;


CREATE TABLE questions (
  id mediumint(8) unsigned NOT NULL auto_increment,
  question varchar(300) default NULL,
  answer varchar(300) default NULL,
  option1 varchar(300) default NULL,
  option2 varchar(300) default NULL,
  PRIMARY KEY (`id`)
) AUTO_INCREMENT=1;


#select * from class;
#select * from questions;
