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
  author VARCHAR(50),
  projectid INT,
  FOREIGN KEY (projectid) REFERENCES projects(projectid)
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

-- for show issues data
SELECT users.userid, CONCAT(users.firstname,' ',users.lastname) fullname, issues.issueid, issues.projectid, issues.tracker, issues.subject, issues.description, issues.status, issues.priority, issues.assignee, issues.startdate, issues.duedate, issues.estimatedate, issues.done, issues.files, issues.spenttime,issues.targetversion, issues.author, CONCAT(u2.firstname, ' ', u2.lastname) authorname, issues.createdate, issues.updatedate, issues.closedate, issues.parenttask, i2.subject namaparentissue 
FROM issues 
LEFT JOIN users ON issues.assignee=users.userid 
LEFT JOIN users u2 ON issues.author=u2.userid 
LEFT JOIN issues i2 ON issues.parenttask = i2.issueid 
WHERE issues.projectid=23

-- for add issue
INSERT INTO issues (projectid,tracker,subject,description,status,priority,assignee,author,startdate,duedate,estimatedate,done,files,spenttime,createdate,updatedate)
VALUES(23, 'bug', 'error when load data', 'data not showing when loaded at vue.js', 'New', 'High', 2, 1,'2020-03-02','2020-03-03','24', 10,'bug.jpg','0',NOW(),NOW())

-- for showing data at add page
SELECT projects.projectid, users.userid, users.firstname, users.lastname
FROM members 
LEFT JOIN projects ON projects.projectid = members.projectid 
LEFT JOIN users ON members.userid = users.userid
WHERE members.projectid=23

-- for add activity
INSERT INTO activity(time, title, description,projectid, author) 
VALUES (NOW(), 'error at line 29', 'New Issue Created : Tracker : [Bug] Subject : error at line 29 - (New) - Done: 0%', 23,1)

-- for show user at edit issue
SELECT userid, email, CONCAT(firstname, ' ', lastname) AS fullname 
FROM users 
WHERE userid IN (SELECT userid FROM members WHERE projectid = 23)

-- for show activity add activity page
SELECT * , (SELECT CONCAT(firstname, ' ', lastname) AS author
FROM users
WHERE userid = activity.author AND projectid = 13) 
FROM activity WHERE projectid = 13 ORDER BY activityid DESC

-- for show activity
-- SELECT (time AT TIME ZONE 'Asia/Jakarta' AT TIME ZONE 'asia/jakarta')::DATE dateactivity, (time AT TIME ZONE 'Asia/Jakarta' AT time zone 'asia/jakarta')::time timeactivity, title, description, author FROM activity WHERE projectid = 23

-- for get parent task
SELECT issues.issueid
FROM issues WHERE projectid=23 AND issueid=22

SELECT issues.issueid, subject
FROM issues
WHERE issueid NOT IN (SELECT issues.issueid
FROM issues
WHERE projectid=23 AND issueid=22)

-- query for insert unique email
CREATE UNIQUE INDEX users_email_key
ON users(email);
-- INSERT INTO users (email, password, firstname, lastname, position, isfulltime, option, optionproject, optionmember, optionissues, isadmin) VALUES('admin@demo.dev','nopassword', 'Super', 'User', 'Manager', 'true', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chkname":"true","chkmember":"true"}', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chktracker":"true","chksubject":"true","chkdesc":"true","chkstat":"true","chkpriority":"true","chkassignee":"true","chkstartdate":"true","chkduedate":"true","chkestimated":"true","chkdone":"true","chkauthor":"true","chkspent":"true","chkfile":"true","chktargetversion":"true","chkcreatedate":"true","chkupdatedate":"true","chkclosedate":"true","chkparenttask":"true"}', true) ON CONFLICT (email) DO NOTHING;`
