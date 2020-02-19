-- table user
CREATE TABLE users(
  userid SERIAL PRIMARY KEY,
  email VARCHAR(30),
  password VARCHAR,
  firstname VARCHAR(30),
  lastame VARCHAR(30)
);

-- ** table project **
CREATE TABLE projects(
  projectid SERIAL PRIMARY KEY,
  name VARCHAR
);

-- ** table members **

-- /* untuk membuat type data enum */
-- create type roles as enum ('manager','programmer','quality assurance');

CREATE TABLE members(
  id SERIAL PRIMARY KEY,
  role roles,
  userid SERIAL,
  projectid SERIAL,
  FOREIGN KEY (userid) REFERENCES users(userid),
  FOREIGN KEY (projectid) REFERENCES projects(projectid)
);

-- ** table issues **

-- /* untuk membuat type data enum */
-- create type trackers as enum ('bug','feature','support');
-- create type statuses as enum ('New','In Progress','Resolved','Feedback','Closed','Rejected');
-- create type priorities as enum ('New','In Progress','Resolved','Feedback','Closed','Rejected');

CREATE TABLE issues(
  issueid SERIAL PRIMARY KEY,
  tracker trackers,
  subject VARCHAR,
  description VARCHAR,
  status statuses,
  priority priorities,
  assignee INT,
  startdate TIMESTAMP,
  duedate DATE,
  estimatedate TIMESTAMP,
  done TIMESTAMP,
  files BYTEA,
  spenttime TIME,
  targetversion VARCHAR,
  author INT,
  createdate TIMESTAMP,
  updatedate TIMESTAMP,
  closedate TIMESTAMP,
  parenttask INT,
  userid SERIAL,
  projectid SERIAL,
  FOREIGN KEY (userid) REFERENCES users(userid),
  FOREIGN KEY (projectid) REFERENCES projects(projectid)
);

-- ** table activity **
CREATE TABLE activity(
  activityid SERIAL PRIMARY KEY,
  time TIME,
  title VARCHAR,
  description VARCHAR,
  author VARCHAR
)