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
    let sqlGet = `SELECT * FROM projects`
    pool.query(sqlGet, (err, data) => {
      if (err) res.status(500).json(err)
      let result = data.rows.map(item => item)
      res.render('project/list', {
        title: 'Dashboard PMS',
        user: req.session.user,
        result
      });
    })
  });

  // to add page
  router.get('/add', isLoggedIn, function (req, res, next) {
    console.log(req.session.user)
    res.render('project/add', {
      title: 'Dashboard PMS',
      user: req.session.user
    });
  });

  // masih progress a.k.a belum selesei
  router.post('/add', function (req, res, next) {
    const id = req.params.id;
    let sqlLoad = `SELECT * FROM users WHERE userid=${id}`;
    console.log(sqlLoad)
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).json(err)
      res.render('project/profile', {
        title: 'Dashboard PMS',
        result: data.rows[0],
        user: req.session.user
      });
    })
  });
  
  return router
};