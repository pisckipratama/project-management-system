var express = require('express');
var router = express.Router();

module.exports = pool => {
  // main page, filtering data/table, and showing data
  router.get('/', function (req, res, next) {
    let user = req.session.user;
    let sql = `SELECT users.userid, users.email, CONCAT(users.firstname,' ',users.lastname) AS name, users.position, users.isfulltime FROM users`;
    let result = [];
    
    const {checkID, checkName, checkEmail, checkPosition, checkTypeJob, inputId, inputName, inputEmail, inputPosition, inputTypeJob} = req.query;

    if (checkID && inputId) {
      result.push(`userid=${inputId}`)
    }

    if (checkName && inputName) {
      result.push(`CONCAT (users.firstname,' ',users.lastname) LIKE '%${inputName}%'`)
    }

    if (checkEmail && inputEmail) {
      result.push(`email='${inputEmail}'`)
    }

    if (checkPosition && inputPosition) {
      result.push(`position='${inputPosition}'`)
    }

    if (checkTypeJob && inputTypeJob) {
      result.push(`isfulltime=${inputTypeJob == 'Full Time' ? true : false}`)
    }

    if (result.length > 0) {
      sql += ' WHERE ';
      if (result.length > 1) {
        for (let i = 0; i < result.length; i++) {
          sql += result[i] + ' AND ';
        }
        sql = sql.slice(-(Math.abs(sql.length)), -4);
      } else {
        for (let i = 0; i < result.length; i++) {
          sql += result[i] + ' ';
        }
      }
    }
    
    sql += ' ORDER BY userid';
    console.log(sql);

    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows.map(item => {
        item.isfulltime = item.isfulltime ? 'Full Time' : 'Part Time'
        return item
      })
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
      res.render('users/edit', {
        title: "Edit User",
        url: "users",
        result
      });
    })
  })

  // post edit user
  router.post('/edit/:userid', (req, res, next) => {
    let sql = '';

    const {editEmail, editFirstname, editLastname, editPassword, editPosition, editJobtype} = req.body;
    if (!editPassword) {
      sql = `UPDATE users SET firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false} WHERE email='${editEmail}'`
    } else {
      sql = `UPDATE users SET firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false}, password='${editPassword}' WHERE email='${editEmail}'`
    }

    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  router.get('/delete/:userid', (req, res, next) => {
    const {userid} = req.params;
    let sql = `DELETE FROM users WHERE userid=${userid}`;

    pool.query(sql, (err) => {
      if (err) res.status(500).json(err)
      res.redirect('/users');
    })
  })

  return router;
}