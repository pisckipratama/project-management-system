// import depedencies
const express = require('express');
const router = express.Router();

module.exports = (pool) => {

  // to get data with id
  router.get('/:id', function (req, res, next) {
    const id = req.params.id;
    let sqlLoad = `SELECT * FROM users WHERE userid=${id}`;
    console.log(sqlLoad)
    pool.query(sqlLoad, (err, data) => {
      if (err) res.status(500).json(err)
      res.render('profile/list', {
        title: 'Dashboard PMS',
        result: data.rows[0],
        user: req.session.user
      });
    })
  });

  // to update profile user
  router.post('/:id', (req, res, next) => {
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
      sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', jobtype='${inputType}' WHERE email='${inputEmail}'`
    } else {
      sqlEdit = `UPDATE users SET firstname='${inputFirstName}', lastname='${inputLastName}', position='${inputPosition}', jobtype='${inputType}', password='${inputPassword}' WHERE email='${inputEmail}'`;
    }

    console.log('Kedua > ' + sqlEdit)

    pool.query(sqlEdit, (err, data) => {
      if (err) return res.status(500).send(err)
      res.redirect('/project')
    })

  })

  return router
}