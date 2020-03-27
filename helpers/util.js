// configure helpers
const helpers = {
  isLoggedIn: (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/");
    }
  },

  isAdmin: (req, res, next) => {
    if (req.session.user.isadmin) {
      next();
    } else {
      req.flash('permissionMessage', 'Permission Denied')
      res.redirect("/project")
    }
  },

  isMemberOne: (req, res, next) => {
    if (data.length > 1) {
      next()
    } else {
      req.flash('permissionMessage', 'Permission Denied')
      res.redirect(`/project/member/${projectid}`)
    }
  }
}

module.exports = helpers;