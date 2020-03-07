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

    bcrypt.hash("nopassword", saltRounds, (err, hash) => {
      let sql = `INSERT INTO users (email, password, firstname, lastname, position, isfulltime, option, optionproject, optionmember, optionissues, isadmin) VALUES('admin@demo.dev', '${hash}', 'Super', 'User', 'Manager', true, '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chkname":"true","chkmember":"true"}', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chktracker":"true","chksubject":"true","chkdesc":"true","chkstat":"true","chkpriority":"true","chkassignee":"true","chkstartdate":"true","chkduedate":"true","chkestimated":"true","chkdone":"true","chkauthor":"true","chkspent":"true","chkfile":"true","chktargetversion":"true","chkcreatedate":"true","chkupdatedate":"true","chkclosedate":"true","chkparenttask":"true"}', true) ON CONFLICT (email) DO NOTHING;
      INSERT INTO users(email, password, firstname, lastname, position, isfulltime, option, optionproject, optionmember, optionissues, isadmin) VALUES('guest@demo.dev', '${hash}', 'Guest', 'User', 'Software Developer', false, '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chkname":"true","chkmember":"true"}', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chktracker":"true","chksubject":"true","chkdesc":"true","chkstat":"true","chkpriority":"true","chkassignee":"true","chkstartdate":"true","chkduedate":"true","chkestimated":"true","chkdone":"true","chkauthor":"true","chkspent":"true","chkfile":"true","chktargetversion":"true","chkcreatedate":"true","chkupdatedate":"true","chkclosedate":"true","chkparenttask":"true"}', false) ON CONFLICT(email) DO NOTHING `
      console.log(sql)
      pool.query(sql, (err, data) => {
        if (err) res.status(500).json(err);
        res.render('login', {
          title: 'PMS Dashboard',
          loginMessage: req.flash('loginMessage')
        });
      })
    })
  });

  router.post('/', (req, res, next) => {
    const {
      email,
      password
    } = req.body;
    let sqlLoad = `SELECT * FROM users WHERE email='${email}'`;
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).send(err)
      let result = data.rows.length == 0 ? data.rows : data.rows[0]
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
        req.flash('loginMessage', 'username wrong or not found.')
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