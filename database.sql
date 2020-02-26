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
  userid INT,
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
SELECT DISTINCT projects.projectid, projects.name FROM projects
LEFT JOIN members ON projects.projectid = members.projectid;

SELECT DISTINCT projects.projectid FROM projects
LEFT JOIN members ON projects.projectid = members.projectid;

SELECT projects.projectid, projects.name, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects
LEFT JOIN members ON projects.projectid = members.projectid
LEFT JOIN users ON users.userid = members.userid
WHERE projects.projectid IN (SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid)

SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid) AS projectmember;

SELECT DISTINCT projects.projectid AS id
FROM projects 
LEFT JOIN members ON projects.projectid = members.projectid

SELECT DISTINCT projects.projectid, projects.name
FROM projects LEFT JOIN members ON projects.projectid = members.projectid

SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname
FROM projects LEFT JOIN members ON projects.projectid = members.projectid 
LEFT JOIN users ON users.userid = members.userid
WHERE projects.projectid IN (SELECT DISTINCT projects.projectid
FROM projects LEFT JOIN members ON projects.projectid = members.projectid ORDER BY projects.projectid);

SELECT DISTINCT projects.projectid, projects.name
FROM projects LEFT JOIN members ON projects.projectid = members.projectid
ORDER BY projects.projectid;

SELECT members.userid, projects.name, projects.projectid
FROM members LEFT JOIN projects ON projects.projectid = members.projectid
WHERE projects.projectid = 21