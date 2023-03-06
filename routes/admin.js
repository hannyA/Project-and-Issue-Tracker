const express = require("express");
const router = express.Router({ mergeParams: true });
const admin = require("../controllers/admins");
const { isLoggedIn, isAdmin } = require("../utils/middleware");
const { addCompany } = require("../middleware/forms");
const { isCompanyAdmin } = require("../middleware/auth");

router.route("/").get(isLoggedIn, admin.users);
router
  .route("/users")
  .get(isLoggedIn, isAdmin, admin.users)
  .post(isLoggedIn, isAdmin, addCompany, admin.newUser)
  .delete(isLoggedIn, isCompanyAdmin, admin.deleteUsers);

router.route("/users/new").get(isLoggedIn, isAdmin, admin.renderNewUserForm);

module.exports = router;
