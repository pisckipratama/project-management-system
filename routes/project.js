var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('project/list', { title: 'Dashboard PMS' });
});


router.get('/profile', function(req, res, next) {
  res.render('project/profile', { title: 'Dashboard PMS' });
});

module.exports = router;
