const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const saltRounds = 10;

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json())

module.exports = pool => {
  router.get('/', (req, res, next) => {
    res.render('login', {
      title: 'PMS Dashboard',
      loginMessage: req.flash('loginMessage')
    });
  });

  router.post('/', (req, res, next) => {
    const { email, password } = req.body;
    let sqlLoad = `SELECT * FROM users WHERE email='${email}'`;
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).send(err)
      let result = data.rows[0]
      let hashpassword = result.password;
      
      bcrypt.compare(password, hashpassword, (err, valid) => {
        if (err) console.error(err)

        if (email === result.email) {
          if (valid) {
            req.session.user = result
            return res.redirect('/project')
          } else {
            req.flash('loginMessage', 'wrong password.')
            return res.redirect('/')
          }
        }
        req.flash('loginMessage', 'wrong or username not found.')
        res.redirect('/')
      })
    })
  });

  router.get('/logout', (req, res, next) => {
    req.session.destroy(function (err) {
      return res.redirect('/');
    })
  });

  return router
};