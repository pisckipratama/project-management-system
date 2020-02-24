var express = require('express');
var router = express.Router();

module.exports = pool => {
  router.get('/', function (req, res, next) {
    let user = req.session.user;
    res.render('users/list', {
      title: "Dashboard PMS",
      url: 'users',
      user
    });
  });

  return router;
}
