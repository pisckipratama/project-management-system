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

    pool.query(sqlGetProjects, (err, dataProject) => {
      if (err) res.status(500).json(err)
      pool.query(sqlGetUsers, (err, dataUsers) => {
        if (err) res.status(500).json(err)
        res.render('project/list', {
          title: 'Dashboard PMS',
          url: 'project',
          user: req.session.user,
          body,
          dataUser: dataUsers.rows.map(item => item),
          dataProject: dataProject.rows.map(item => item)
        });
      })
    })
  });

  router.post('/', isLoggedIn, function (req, res, next) {
    const body = req.body;
    res.redirect('/project')
  });

  // to add page
  router.get('/add', isLoggedIn, function (req, res, next) {
    const sqlAdd1 = `SELECT * FROM users`;
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

  // masih progress a.k.a belum selesei
  router.post('/add', function (req, res, next) {
    const id = req.params.id;
    const body = req.body
    console.log(body)
    let sqlLoad = `SELECT * FROM users WHERE userid=${id}`;
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).json(err)
      res.render('project/profile', {
        title: 'Dashboard PMS',
        result: data.rows[0],
        user: req.session.user,
        url: 'project',
      });
    })
  });

  return router
};