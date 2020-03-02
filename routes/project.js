// import depedencies
const express = require('express');
const router = express.Router();
const moment = require('moment')
moment.locale('id')

// cofigure middleware for session
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/')
  }
}

module.exports = (pool) => {

  // to landing main page, filter data projects, and pagination
  router.get('/', isLoggedIn, function (req, res, next) {
    const {checkID, checkName, checkMember, inputID, inputName, inputMember} = req.query;
    const link = (req.url == '/') ? '/?page=1' : req.url;
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    let params = [];

    if (checkID && inputID) {
      params.push(`projects.projectid='${inputID}'`)
    }

    if (checkName && inputName) {
      params.push(`projects.name LIKE '%${inputName}%'`)
    }

    if (checkMember && inputMember) {
      params.push(`members.userid='${inputMember}'`)
    }

    let sql = `SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;

    if (params.length > 0) {
      sql += ` WHERE ${params.join(" AND ")}`;
    }
    sql += `) AS projectmember`;

    pool.query(sql, (err, count) => {
      if (err) res.status(500).json(err);

      const total = count.hasOwnProperty('rows') ? count.rows[0].total : 0;
      const pages = Math.ceil(total / limit);

      sql = `SELECT DISTINCT projects.projectid, projects.name FROM projects LEFT JOIN members ON projects.projectid = members.projectid`

      if (params.length > 0) {
        sql += ` WHERE ${params.join(" AND ")}`;
      } 
      sql += ` ORDER BY projects.projectid DESC LIMIT ${limit} OFFSET ${offset}`;
      
      let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;

      if (params.length > 0) {
        subquery += ` WHERE ${params.join(" AND ")}`
      }
      subquery += ` ORDER BY projects.projectid DESC LIMIT ${limit} OFFSET ${offset}`;

      let sqlMember = `SELECT projects.projectid, users.userid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`;

      pool.query(sql, (err, projectData) => {
        if (err) res.status(500).json(err);

        pool.query(sqlMember, (err, memberData) => {
          if (err) res.status(500).json(err);
          
          projectData.rows.map(project => {
            project.member = memberData.rows.filter(member => member.projectid == project.projectid).map(data => data.fullname).sort().join(', ').trim()
          })

          let sqlUser = `SELECT * FROM users`;
          pool.query(sqlUser, (err, data) => {
            if (err) res.status(500).json(err)

            let sqlGetOption = `SELECT optionproject FROM users WHERE userid=${req.session.user.userid}`;
            pool.query(sqlGetOption, (err, dataOption) => {
              if (err) res.status(500).json(err);
              res.render('project/list', {
                title: 'PMS Dashboard',
                url: 'project',
                user: req.session.user,
                query: req.query,
                page,
                pages,
                link,
                dataUser: data.rows.map(item => item),
                dataProject: projectData.rows.map(item => item),
                projectMessage: req.flash('projectMessage'),
                option: dataOption.rows[0].optionproject
              })
            })
          })
        })
      })
    })
  });
  
  // for option table
  router.post("/option", isLoggedIn, (req, res, next) => {
    const user = req.session.user;
    let sqlUpdateOption = `UPDATE users SET optionproject='${JSON.stringify(req.body)}' WHERE userid=${user.userid}`;
    
    pool.query(sqlUpdateOption, (err) => {
      if (err) res.status(500).json(err);
      res.redirect('/project');
    })
  })

  // to add project page
  router.get('/add', isLoggedIn, function (req, res, next) {
    const sqlAdd1 = `SELECT * FROM users ORDER BY userid`;
    pool.query(sqlAdd1, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows.map(item => item);

      res.render('project/add', {
        title: 'PMS Dashboard',
        user: req.session.user,
        url: 'project',
        result, 
        projectMessage: req.flash('projectMessage')
      });
    })
  });

  // to post add project
  router.post('/add', isLoggedIn, function (req, res, next) {
    const { name, member } = req.body;
    if (name && member) {
      const insertId = `INSERT INTO projects (name) VALUES ('${name}')`
      pool.query(insertId, (err, dbProjects) => {

        let selectidMax = `SELECT MAX (projectid) FROM projects`
        pool.query(selectidMax, (err, dataMax) => {
          let insertidMax = dataMax.rows[0].max
          let insertMember = 'INSERT INTO members (userid, role, projectid) VALUES '
          if (typeof member == 'string') {
            insertMember += `(${member}, ${insertidMax});`
          } else {
            let members = member.map(item => {
              return `(${item}, ${insertidMax})`
            }).join(',')
            insertMember += `${members};`
          }
          pool.query(insertMember, (err, dataSelect) => {            
            res.redirect('/project');
          })
        })
      })
    } else {
      req.flash('projectMessage', 'Please add members')
      res.redirect('/project/add');
    }

  });

  // edit project landing page
  router.get('/edit/:projectid', isLoggedIn, (req, res, next) => {
    const projectid = req.params.projectid;
    let sqlEditProject = `SELECT members.userid, projects.name, projects.projectid FROM members LEFT JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid = ${projectid}`;
    let sqlEditUser = `SELECT * FROM users`;

    pool.query(sqlEditProject, (err, dataProjects) => {
      if (err) res.status(500).json(err)
      let dataProject = dataProjects.rows.map(item => item)
      pool.query(sqlEditUser, (err, dataUser) => {
        if (err) res.status(500).json(err);
        res.render('project/edit', {
          user: req.session.user,
          url: 'project',
          title: 'PMS Dashboard',
          dataProject: dataProject[0],
          dataUser: dataUser.rows,
          dataMembers: dataProjects.rows.map(item => item.userid)
        });
      })
    })
  })

  // to post edit project
  router.post('/edit/:projectid', isLoggedIn, (req, res, next) => {
    const {projectid} = req.params;
    const {editProject, editMember} = req.body;

    let sqlUpdate = `UPDATE projects SET name='${editProject}' WHERE projectid=${projectid}`;

    pool.query(sqlUpdate, (err) => {
      if (err) res.status(500).json(err);
      let sqlDeleteMember = `DELETE FROM members WHERE projectid = ${projectid}`;

      pool.query(sqlDeleteMember, (err) => {
        if (err) res.status(500).json(err);
        let temp = [];
        if (typeof editMember == 'string') {
          temp.push(`(${editMember}, ${projectid})`);
        } else {
          for (let i = 0; i < editMember.length; i++) {
            temp.push(`(${editMember[i]}, ${projectid})`)
          }
        }

        let sqlInsertMembers = `INSERT INTO members (userid, role, projectid) VALUES ${temp.join(",")}`;
        console.log(temp)
        console.log(sqlInsertMembers);

        pool.query(sqlInsertMembers, err => {
          res.redirect('/project')
        })
      })
    })
  })

  // to delete project 
  router.get('/delete/:projectid', isLoggedIn, (req, res, next) => {
    const projectid = req.params.projectid;
    let sqlDeleteProject = `DELETE FROM members WHERE projectid=${projectid};
    DELETE FROM projects WHERE projectid=${projectid};
    DELETE FROM issues WHERE projectid=${projectid};`;

    pool.query(sqlDeleteProject, (err) => {
      if (err) res.status(500).json(err)
      res.redirect('/project');
    })
  })
  
  // to landing overview page
  router.get('/overview/:projectid', isLoggedIn, (req, res, next) => {
    const {projectid} = req.params;
    const user = req.session.user;
    
    let sqlShow = `SELECT * FROM projects WHERE projectid=${projectid}`;

      pool.query(sqlShow, (err, data) => {
        if (err) res.status(500).json(err);

        res.render('overview/list', {
          title: 'PMS Dashboard',
          user,
          url: 'project',
          url2: 'overview',
          result: data.rows[0]
        });
      })
    })

  // to landing member page
  router.get('/member/:projectid', isLoggedIn, (req, res, next) => {
    const {projectid} = req.params;
    const user = req.session.user;
    
    // variable for pagination
    const link = (req.url == `/member/${projectid}`) ? `/member/${projectid}/?page=1` : req.url;
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit

    // variable for filtering
    const {checkID, checkName, checkPosition, inputID, inputName, inputPosition} = req.query;
    let filter = [];

    if (checkID && inputID) {
      filter.push(`members.id=${inputID}`);
    }
    if (checkName && inputName) {
      filter.push(`CONCAT (users.firstname,' ',users.lastname) ILIKE '%${inputName}%'`);
    }
    if (checkPosition && inputPosition) {
      filter.push(`members.role='${inputPosition}'`);
    }

    let sql = `SELECT COUNT(member) as total  FROM (SELECT members.userid FROM members JOIN users ON members.userid = users.userid WHERE members.projectid = ${projectid}`;
    if (filter.length > 0) {
      sql += ` AND ${filter.join(" AND ")}`;
    }
    sql += ') AS member'

    pool.query(sql, (err, count) => {
      if (err) res.status(500).json(err);
      const total = count.rows[0].total;
      const pages = Math.ceil(total / limit);
      let sqlMember = `SELECT projects.projectid, members.id, members.role, CONCAT(users.firstname,' ',users.lastname) AS fullname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${projectid}`;
      if (filter.length > 0) {
        sqlMember += ` AND ${filter.join(' AND ')}`
      }
      sqlMember += ` ORDER BY members.id LIMIT ${limit} OFFSET ${offset}`

      pool.query(sqlMember, (err, dataMembers) => {
        if (err) res.status(500).json(err);
        let sqlShow = `SELECT * FROM projects WHERE projectid=${projectid}`;
        
        pool.query(sqlShow, (err, data) => {
          if (err) res.status(500).json(err);

          let sqlOption = `SELECT optionmember FROM users WHERE userid=${user.userid}`;
          pool.query(sqlOption, (err, option) => {
            if (err) res.status(500).json(err);
            res.render('member/list', {
              data: dataMembers.rows,
              projectid,
              page,
              totalPage: pages,
              link,
              title: 'PMS Dashboard',
              user,
              url: 'project',
              url2: 'member',
              result: data.rows[0],
              option: option.rows[0].optionmember,
              memberMessage: req.flash('memberMessage')
            })
          })
        })
      })
    });
  })

  // post option at member page
  router.post('/member/:projectid', isLoggedIn, (req, res, next) => {
    const user = req.session.user
    const {projectid} = req.params;
    let sqlUpdateOption = `UPDATE users SET optionmember='${JSON.stringify(req.body)}' WHERE userid=${user.userid}`;

    pool.query(sqlUpdateOption, err => {
      if (err) res.status(500).json(err)
      res.redirect(`/project/member/${projectid}`);
    })
  })

  // landing to add member page at member page
  router.get('/member/:projectid/add', isLoggedIn, (req, res, next) => {
    const user = req.session.user;
    const {projectid} = req.params;
    let sqlShow = `SELECT * FROM projects WHERE projectid=${projectid}`
    pool.query(sqlShow, (err, data) => {
      if (err) res.status(500).json(err);

      let sql = `SELECT userid, email, CONCAT(firstname,' ',lastname) AS fullname FROM users WHERE userid NOT IN (SELECT userid FROM members WHERE projectid=${projectid})`;
      pool.query(sql, (err, dataUsers) => {
        if (err) res.status(500).json(err);
        if (dataUsers.rows.length > 0) {
          res.render('member/add', {
            user,
            title: 'PMS Dashboard',
            url: 'project',
            url2: 'member',
            result: data.rows[0],
            dataUser: dataUsers.rows,
            memberMessage: req.flash('memberMessage')
          })
        } else {
          req.flash('memberMessage', `Member on ${data.rows[0].name} is full`)
          res.redirect(`/project/member/${projectid}`);
        }
      })
    })
  })

  // to post add member at member page
  router.post('/member/:projectid/add', isLoggedIn, (req, res, next) => {
    const {projectid} = req.params
    let data = [req.body.inputMember, req.body.inputPosition];
    console.log(data);
    let sql = `INSERT INTO members(userid, role, projectid) VALUES($1, $2, ${projectid})`
    pool.query(sql, data, (err) => {
      if (err) res.status(500).json(err);
      res.redirect(`/project/member/${projectid}`)
    })
  })

  // landing to edit page at member page
  router.get('/member/:projectid/edit/:memberid', isLoggedIn, (req, res, next) => {
    const {projectid, memberid} = req.params;
    const user = req.session.user
    let sqlShow = `SELECT * FROM projects WHERE projectid=${projectid}`

    pool.query(sqlShow, (err, data) => {
      if(err) res.status(500).json(err)

      let sqlData = `SELECT users.firstname, users.lastname, members.role, members.id FROM members LEFT JOIN users ON users.userid = members.userid LEFT JOIN projects ON projects.projectid = members.projectid WHERE projects.projectid=${projectid} AND id=${memberid}`
      pool.query(sqlData, (err, dataUsers) => {
        if (err) res.status(500).json(err);
        res.render('member/edit', {
          user,
          title: 'PMS Dashboard',
          url: 'project',
          url2: 'member',
          result: data.rows[0],
          dataUser: dataUsers.rows[0]
        })
      })
    })
  })

  // to post edit member page
  router.post('/member/:projectid/edit/:memberid', isLoggedIn, (req, res, next) => {
    const {projectid, memberid} = req.params;
    let data = [req.body.inputPosition, memberid]

    let sqlEdit = `UPDATE members SET role=$1 WHERE id=$2`;
    pool.query(sqlEdit, data, (err) => {
      if (err) res.status(500).json(err)
      res.redirect(`/project/member/${projectid}`)
    })
  })

  // for deleting member at member page
  router.get('/member/:projectid/delete/:memberid', isLoggedIn, (req, res, next) => {
    const {projectid, memberid} = req.params

    let sqlDelete = `DELETE FROM members WHERE projectid=${projectid} AND id=${memberid}`
    console.log(sqlDelete)
    pool.query(sqlDelete, err => {
      if (err) res.status(500).json(err)
      res.redirect(`/project/member/${projectid}`)
    })
  })

  // for landing to issues page
  router.get('/issues/:projectid', isLoggedIn, (req, res, next) => {
    const {projectid} = req.params
    const user = req.session.user
    const {checkID, inputID, checkSubject, inputSubject, checkTracker, inputTracker} = req.query;
    let filter = [];
    const url = (req.url == `/issues/${projectid}` ? `/issues/${projectid}/?page=1` : req.url);
    let page = req.query.page || 1;
    let limit = 3;
    let offset = (page - 1) * limit;

    if (checkID && inputID) {
      filter.push(`issues.issueid=${inputID}`)
    }
    if (checkSubject && inputSubject) {
      filter.push(`issues.subject ILIKE '${inputSubject}'`)
    }
    if (checkTracker && inputTracker) {
      filter.push(`issues.tracker='${inputTracker}'`)
    }

    let sqlLoad = `SELECT COUNT(*) AS total FROM issues WHERE projectid=${projectid}`;

    if (filter.length > 0) {
      sqlLoad += ` AND ${filter.join(" AND ")}`
    }

    pool.query(sqlLoad, (err, count) => {
      if (err) res.status(500).json(err)
      const total = count.rows[0].total;
      const pages = Math.ceil(total / limit)

      let sqlIssues = `SELECT users.userid, CONCAT(users.firstname,' ',users.lastname) fullname, i1.issueid, i1.projectid, i1.tracker, i1.subject, i1.description, i1.status, i1.priority, i1.assignee, i1.startdate, i1.duedate, i1.estimatedate, i1.done, i1.files, i1.spenttime,i1.targetversion, i1.author, CONCAT(u2.firstname, ' ', u2.lastname) authorname, i1.createdate, i1.updatedate, i1.closedate, i1.parenttask, i2.subject namaparentissue FROM issues i1 LEFT JOIN users ON i1.assignee=users.userid LEFT JOIN users u2 ON i1.author=u2.userid LEFT JOIN issues i2 ON i1.parenttask = i2.issueid WHERE i1.projectid=${projectid}`
      
      if (filter.length < 0) {
        sqlIssues += ` AND ${filter.join(' AND ')}`
      }
      sqlIssues += ` ORDER BY i1.issueid LIMIT ${limit} OFFSET ${offset}`

      let sqlShow = `SELECT * FROM projects WHERE projectid=${projectid}`
      pool.query(sqlShow, (err, data) => {
        if (err) res.status(500).json(err)
        
        pool.query(sqlIssues, (err, dataIssue) => {
          if (err) res.status(500).json(err)

          let sqlOption = `SELECT optionissues FROM users WHERE userid=${user.userid}`;
          pool.query(sqlOption, (err, optionissue) => {
            if (err) res.status(500).json(err);
            
            res.render('issues/list', {
              user,
              link: url,
              title: 'PMS Dashboard',
              url: 'project',
              url2: 'issues',
              result: data.rows[0],
              dataIssues: dataIssue.rows,
              page,
              pages,
              query: req.query,
              projectid,
              option: optionissue.rows[0].optionissues,
              moment
            })
          })
        })
      })
    })
  })

  // for option column issues page
  router.post('/issues/:projectid', (req, res, next) => {
    const {projectid} = req.params
    const user = req.session.user

    let sqlOption = `UPDATE users SET optionissues='${JSON.stringify(req.body)}' WHERE userid=${user.userid}`
    pool.query(sqlOption, err => {
      if (err) res.status(500).json(err)
      res.redirect(`/project/issues/${projectid}`)
    })
  })
  
  return router
};