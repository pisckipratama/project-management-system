const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const helpers = require('../helpers/util')

module.exports = pool => {
  // main page, filtering data/table, and showing data
  router.get('/', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    let user = req.session.user;
    let sql = `SELECT users.userid, users.email, CONCAT(users.firstname,' ',users.lastname) AS name, users.position, users.isfulltime FROM users`;

    // logic for filtering
    let result = [];

    const {
      checkID,
      checkName,
      checkEmail,
      checkPosition,
      checkTypeJob,
      inputId,
      inputName,
      inputEmail,
      inputPosition,
      inputTypeJob
    } = req.query;

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
        if (err) res.status(500).json(err);
        let result = data.rows.map(item => {
          item.isfulltime = item.isfulltime ? 'Full Time' : 'Part Time'
          return item
        })

        let sqlOption = `SELECT option FROM users WHERE userid = ${user.userid}`;
        pool.query(sqlOption, (err, dataOption) => {
          res.render('users/list', {
            title: "PMS Dashboard",
            url: 'users',
            user,
            result,
            totalPage,
            page: parseInt(page),
            link,
            query: req.query,
            option: dataOption.rows[0].option,
            permissionMessage: req.flash('permissionMessage')
          });
        })
      })
    })
  });

  router.post('/', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    let user = req.session.user;
    let sqlEditOption = `UPDATE users SET option='${JSON.stringify(req.body)}' WHERE userid=${user.userid}`;

    pool.query(sqlEditOption, err => {
      if (err) res.status(500).json(err);
      res.redirect('/users');
    })
  })

  // route to add data page
  router.get('/add', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    let user = req.session.user;
    res.render('users/add', {
      title: "PMS Dashboard",
      url: "users",
      user,
      permissionMessage: req.flash('permissionMessage')
    })
  })

  // post data
  router.post('/add', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    const user = req.session.user
    const {
      password,
      firstname,
      lastname,
      email,
      position
    } = req.body;
    const isfulltime = req.body.jobtype == 'Full Time' ? true : false;

    bcrypt.hash(password, saltRounds, (err, hash) => {
      let sql = `INSERT INTO users (email, password, firstname, lastname, position, isfulltime, option, optionproject, optionmember, optionissues, isadmin) VALUES ('${email}', '${hash}', '${firstname}', '${lastname}', '${position}', '${isfulltime}', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chkname":"true","chkmember":"true"}', '{"chkid":"true","chkname":"true","chkposition":"true"}', '{"chkid":"true","chktracker":"true","chksubject":"true","chkdesc":"true","chkstat":"true","chkpriority":"true","chkassignee":"true","chkstartdate":"true","chkduedate":"true","chkestimated":"true","chkdone":"true","chkauthor":"true"}', false)`;
      pool.query(sql, (err, data) => {
        if (err) res.status(500).json(err);
        res.redirect('/users');
      })
    })
  })

  // get user by id for editing
  router.get('/edit/:userid', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    const user = req.session.user;
    const {
      userid
    } = req.params
    let sql = `SELECT * FROM users WHERE userid=${userid}`;
    pool.query(sql, (err, data) => {
      if (err) res.status(500).json(err);
      let result = data.rows[0];
      res.render('users/edit', {
        title: "PMS Dashboard",
        url: "users",
        result,
        user
      });
    })
  })

  // post edit user
  router.post('/edit/:userid', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    let sql = '';
    const {
      userid
    } = req.params;

    const {
      editEmail,
      editFirstname,
      editLastname,
      editPassword,
      editPosition,
      editJobtype
    } = req.body;

    bcrypt.hash(editPassword, saltRounds, (err, hash) => {
      if (err) console.error(err)
      if (!editPassword) {
        sql = `UPDATE users SET email='${editEmail}', firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false} WHERE userid=${userid}`
      } else {
        sql = `UPDATE users SET email='${editEmail}', firstname='${editFirstname}', lastname='${editLastname}', position='${editPosition}', isfulltime=${editJobtype == 'Full Time' ? true : false}, password='${hash}' WHERE userid=${userid}`
      }

      pool.query(sql, (err, data) => {
        if (err) res.status(500).json(err);
        res.redirect('/users');
      })
    })
  })

  router.get('/delete/:userid', helpers.isLoggedIn, helpers.isAdmin, (req, res, next) => {
    const user = req.session.user
    const {
      userid
    } = req.params;
    let sql = `DELETE FROM users WHERE userid=${userid}`;

    pool.query(sql, (err) => {
      if (err) res.status(500).json(err)
      res.redirect('/users', {
        user
      });
    })
  })

  return router;
}