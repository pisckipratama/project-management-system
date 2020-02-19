var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Project Management System' });
});

router.post('/', function(req, res, next) {
  res.redirect('/project');
});

router.get('/logout', function (req, res, next) {
  res.redirect('/');
});

module.exports = router;
