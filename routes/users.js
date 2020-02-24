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

  // add data
  router.get('/add', (req, res, next) => {
    let user = req.session.user;
    console.log(req.body)

    let sql = `SELECT * FROM users`;
    // let sql = `INSERT INTO users (email, password, firstname, lastname, position, isfulltime) VALUES ()`
    res.render('users/add', {
      title: "Add User",
      url: "users",
      user
    })
  })

  return router;
}
