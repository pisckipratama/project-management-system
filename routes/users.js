var express = require('express');
var router = express.Router();

module.exports = pool => {
  // main page, filtering data/table, and showing data
  router.get('/', function (req, res, next) {
    let user = req.session.user;
    let sql = `SELECT users.userid, users.email, CONCAT(users.firstname,' ',users.lastname) AS name, users.position, users.isfulltime FROM users ORDER BY userid`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows.map(item => {
        item.isfulltime = item.isfulltime ? 'Full Time' : 'Part Time'
        return item
      })
      console.log(result)
      res.render('users/list', {
        title: "Dashboard PMS",
        url: 'users',
        user,
        result
      });
    })
  });

  // route to add data page
  router.get('/add', (req, res, next) => {
    let user = req.session.user;
    res.render('users/add', {
      title: "Add User",
      url: "users",
      user
    })
  })

  // post data
  router.post('/add', (req, res, next) => {
    console.log(req.body);
    const {password, firstname, lastname, email, position} = req.body;
    const isfulltime = req.body.jobtype == 'Full Time' ? true : false;

    let sql = `INSERT INTO users (email, password, firstname, lastname, position, isfulltime) VALUES ('${email}', '${password}', '${firstname}', '${lastname}', '${position}', '${isfulltime}')`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  // get user by id for editing
  router.get('/edit/:userid', (req, res, next) => {
    const {userid} = req.params
    let sql = `SELECT * FROM users WHERE userid=${userid}`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows[0];
      console.log(result);
      res.render('users/edit', {
        title: "Edit User",
        url: "users",
        result
      });
    })
  })

  // post edit user
  router.post('/edit/:userid', (req, res, next) => {
    console.log(req.body);
    let sql = '';

    const {editEmail, editFirstname, editLastname, editPassword, editPosition, editJobtype} = req.body;
    if (!editPassword) {
      sql = `UPDATE users SET firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false} WHERE email='${editEmail}'`
    } else {
      sql = `UPDATE users SET firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false}, password='${editPassword}' WHERE email='${editEmail}'`
    }

    console.log(sql);
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  return router;
}