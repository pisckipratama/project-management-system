const express = require('express');
const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', isLoggedIn, function(req, res, next) {
  res.render('project/list', { title: 'Dashboard PMS' });
});

router.get('/profile', function(req, res, next) {
  res.render('project/profile', { title: 'Dashboard PMS' });
});

module.exports = router;
