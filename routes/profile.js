// import depedencies
const express = require('express');
const router = express.Router();

module.exports = (pool) => {

  // edit profile user
  router.get('/', function (req, res, next) {
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
        title: 'Dashboard PMS',
        user,
        result
      })
    })
  });

  // to update profile user
  router.post('/', (req, res, next) => {
    const {
      inputEmail,
      inputPassword,
      inputLastName,
      inputFirstName,
      inputPosition,
      inputType
    } = req.body;
    let sqlEdit = ''
    console.log('Pertama > ' + sqlEdit);

    if (!inputPassword) {
      sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', isfulltime='${inputType == 'Full Time' ? true : false}' WHERE email='${inputEmail}'`
    } else {
      sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', isfulltime='${inputType == 'Full Time' ? true : false}', password='${inputPassword}' WHERE email='${inputEmail}'`;
    }

    console.log('Kedua > ' + sqlEdit)

    pool.query(sqlEdit, (err, data) => {
      if (err) return res.status(500).send(err)
      res.redirect('/project')
    })

  })

  return router
}