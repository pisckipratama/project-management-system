-- table user
CREATE TABLE users(
  userid SERIAL PRIMARY KEY,
  email VARCHAR(30),
  password VARCHAR(100),
  firstname VARCHAR(30),
  lastame VARCHAR(30)
);

-- ** table project **
CREATE TABLE projects(
  projectid SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

-- ** table members **

CREATE TABLE members(
  id SERIAL PRIMARY KEY,
  userid INT,
  role VARCHAR(20),
  projectid INT,
  FOREIGN KEY (userid) REFERENCES users(userid),
  FOREIGN KEY (projectid) REFERENCES projects(projectid)
);

-- ** table issues **

CREATE TABLE issues(
  issueid SERIAL PRIMARY KEY,
  projectid INT,
  tracker VARCHAR(10),
  subject VARCHAR(30),
  description TEXT,
  status VARCHAR(20),
  priority VARCHAR(15),
  assignee INT,
  startdate DATE,
  duedate DATE,
  estimatedate REAL,
  done INT,
  files VARCHAR(100),
  spenttime REAL,
  targetversion VARCHAR(100),
  author INT,
  createdate TIMESTAMP,
  updatedate TIMESTAMP,
  closedate TIMESTAMP,
  parenttask INT,
  FOREIGN KEY (userid) REFERENCES users(userid),
  FOREIGN KEY (projectid) REFERENCES projects(projectid)
);

-- ** table activity **
CREATE TABLE activity(
  activityid SERIAL PRIMARY KEY,
  time TIMESTAMP,
  title VARCHAR(50),
  description TEXT,
  author VARCHAR(50)
)