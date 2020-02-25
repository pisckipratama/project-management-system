var express = require('express');
var router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/')
  }
}

module.exports = pool => {
  // main page, filtering data/table, and showing data
  router.get('/', isLoggedIn, function (req, res, next) {
    let user = req.session.user;
    let sql = `SELECT users.userid, users.email, CONCAT(users.firstname,' ',users.lastname) AS name, users.position, users.isfulltime FROM users`;
    
    // logic for filtering
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
    
    // end logic for filtering

    // start logic for pagination
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);

      const totalPage = Math.ceil(data.rows.length / limit);
      const link = req.url == '/' ? '/?page=1' : req.url;

      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      // end logic for pagination

      pool.query(sql, (err, data) => {
        let result = data.rows.map(item => {
          item.isfulltime = item.isfulltime ? 'Full Time' : 'Part Time'
          return item
        })
        res.render('users/list', {
          title: "Dashboard PMS",
          url: 'users',
          user,
          result,
          totalPage,
          page: parseInt(page),
          link,
          query: req.query
        });
      })
    })
  });

  // route to add data page
  router.get('/add', isLoggedIn, (req, res, next) => {
    let user = req.session.user;
    res.render('users/add', {
      title: "Add User",
      url: "users",
      user
    })
  })

  // post data
  router.post('/add', isLoggedIn, (req, res, next) => {
    const user = req.session.user
    const {password, firstname, lastname, email, position} = req.body;
    const isfulltime = req.body.jobtype == 'Full Time' ? true : false;

    let sql = `INSERT INTO users (email, password, firstname, lastname, position, isfulltime) VALUES ('${email}', '${password}', '${firstname}', '${lastname}', '${position}', '${isfulltime}')`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  // get user by id for editing
  router.get('/edit/:userid', isLoggedIn, (req, res, next) => {
    const user = req.session.user;
    const {userid} = req.params
    let sql = `SELECT * FROM users WHERE userid=${userid}`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows[0];
      res.render('users/edit', {
        title: "Edit User",
        url: "users",
        result,
        user
      });
    })
  })

  // post edit user
  router.post('/edit/:userid', isLoggedIn, (req, res, next) => {
    let sql = '';
    const { userid } = req.params;

    const {editEmail, editFirstname, editLastname, editPassword, editPosition, editJobtype} = req.body;
    if (!editPassword) {
      sql = `UPDATE users SET email='${editEmail}', firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false} WHERE userid='${userid}'`
    } else {
      sql = `UPDATE users SET email='${editEmail}', firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false}, password='${editPassword}' WHERE userid=${userid}`
    }

    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  router.get('/delete/:userid', isLoggedIn, (req, res, next) => {
    const user = req.session.user
    const {userid} = req.params;
    let sql = `DELETE FROM users WHERE userid=${userid}`;

    pool.query(sql, (err) => {
      if (err) res.status(500).json(err)
      res.redirect('/users', { user });
    })
  })

  return router;
}