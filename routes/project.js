// import depedencies
const express = require('express');
const router = express.Router();

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
              projectMessage: req.flash('projectMessage')
            })
          })
        })
      })
    })
  });
  
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
  
  return router
};