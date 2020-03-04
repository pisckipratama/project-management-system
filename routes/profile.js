// import depedencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const saltRounds = 10;
const helpers = require('../helpers/util')

module.exports = (pool) => {

  // edit profile user
  router.get('/', helpers.isLoggedIn, (req, res, next) => {
    // console.log(req.headers.host)
    // const id = req.params.id;
    let user = req.session.user;
    console.log(user)
    const sqlList = `SELECT * FROM users WHERE email='${user.email}'`;
    console.log(sqlList)
    pool.query(sqlList, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows[0]
      console.log(result)
      res.render('profile/list', {
        url: 'profile',
        title: 'PMS Dashboard',
        user,
        result
      })
    })
  });

  // to update profile user
  router.post('/', helpers.isLoggedIn, (req, res, next) => {
    const {
      inputEmail,
      inputPassword,
      inputLastName,
      inputFirstName,
      inputPosition,
      inputType
    } = req.body;
    let sqlEdit = ''

    bcrypt.hash(inputPassword, saltRounds, (err, hash) => {
      if (err) console.error(err)

      if (!inputPassword) {
        sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', isfulltime='${inputType == 'Full Time' ? true : false}' WHERE email='${inputEmail}'`
      } else {
        sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', isfulltime='${inputType == 'Full Time' ? true : false}', password='${hash}' WHERE email='${inputEmail}'`;
      }

      pool.query(sqlEdit, (err, data) => {
        if (err) return res.status(500).send(err)
        res.redirect('/project')
      })
    })


  })

  return router
}