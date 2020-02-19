const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json())

module.exports = pool => {
  router.get('/', (req, res, next) => {
    res.render('login', {
      title: 'Project Management System',
      loginMessage: req.flash('loginMessage')
    });
  });

  router.post('/', (req, res, next) => {
    const { email, password } = req.body;
    let sqlLoad = `SELECT * FROM users`;
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).send(err)
      let result = data.rows.map(item => item)
      
      for (const property in result) {
        if (email === result[property].email) {
          if (password === result[property].password) {
            req.session.user = result[property]
            return res.redirect('/project')
          } else {
            req.flash('loginMessage', 'wrong password.')
            return res.redirect('/')
          }
        }
      }
      req.flash('loginMessage', 'wrong or username not found.')
      res.redirect('/')      
    })
  });

  router.get('/logout', (req, res, next) => {
    req.session.destroy(function (err) {
      return res.redirect('/');
    })
  });

  return router
};