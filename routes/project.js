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
  // to landing profile
  router.get('/', isLoggedIn, function (req, res, next) {
    let sqlGetProjects = `SELECT * FROM projects`;
    let sqlGetUsers = `SELECT * FROM users`;
    const body = req.body;

    const {
      checkID,
      checkName,
      checkMember,
      inputID,
      inputName,
      inputMember
    } = req.query;
    let content = [];

    if (checkID && inputID) {
      content.push = `projectid=${inputID}`
    }
    if (checkName && inputName) {
      content.push = `name='${inputName}'`
    }
    if (checkMember && inputMember) {
      content.push = `member='${inputMember}'`;
    }

    pool.query(sqlGetProjects, (err, dataProjects) => {
      if (err) res.status(500).json(err)
      let dataProject = dataProjects.rows.map(item => item);
      pool.query(sqlGetUsers, (err, dataUsers) => {
        if (err) res.status(500).json(err)
        let dataUser = dataUsers.rows.map(item => item);
        res.render('project/list', {
          title: 'Dashboard PMS',
          url: 'project',
          user: req.session.user,
          body,
          dataUser,
          dataProject
        });
      })
    })
  });

  // for searching data on progress
  router.post('/', isLoggedIn, function (req, res, next) {
    const {
      chkid,
      chkname,
      chkmember
    } = req.body;
    res.redirect('/project')
  });

  // to add page
  router.get('/add', isLoggedIn, function (req, res, next) {
    const sqlAdd1 = `SELECT * FROM users ORDER BY userid`;
    pool.query(sqlAdd1, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows.map(item => item);

      res.render('project/add', {
        title: 'Dashboard PMS',
        user: req.session.user,
        url: 'project',
        result
      });
    })
  });

  // to post add project
  router.post('/add', isLoggedIn, function (req, res, next) {
    const {
      name,
      member
    } = req.body;


    if (name && member) {
      ceklist = true

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

          console.log(insertMember)
          pool.query(insertMember, (err, dataSelect) => {

          })
        })
      })
      res.redirect('/project');
    } else {
      console.log("data kosong");
      req.flash('dataNull', 'Please Select Member ')
      res.redirect('/project/add');
    }

  });

  // edit data landing page
  router.get('/edit/:projectid', isLoggedIn, (req, res, next) => {
    const projectid = req.params.projectid;
    let sqlEditProject = `SELECT * FROM projects WHERE projectid=${projectid}`;
    let sqlEditUser = `SELECT * FROM users`;

    pool.query(sqlEditProject, (err, dataProject) => {
      if (err) res.status(500).json(err)
      let result = dataProject.rows.map(item => item)
      pool.query(sqlEditUser, (err, dataUser) => {
        if (err) res.status(500).json(err);
        res.render('project/edit', {
          user: req.session.user,
          url: 'project',
          title: 'Dashboard PMS',
          result: result[0],
          dataUser: dataUser.rows.map(item => item)
        });
      })
    })
  })

  // delete project 
  router.get('/delete/:projectid', isLoggedIn, (req, res, next) => {
    const projectid = req.params.projectid;
    let sqlEditProject = `DELETE FROM projects WHERE projectid=${projectid}`;

    pool.query(sqlEditProject, (err) => {
      if (err) res.status(500).json(err)
      res.redirect('/project');
    })
  })
  return router
};