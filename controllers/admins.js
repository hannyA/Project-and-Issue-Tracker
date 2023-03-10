const Project = require("../models/project");
const Issue = require("../models/issue");
const User = require("../models/user");
const { getCompanyUsers } = require("./util");

module.exports.users = async (req, res) => {
  const users = await getCompanyUsers(req, res);
  const page = "users";
  res.render("admin/users/index", { users, page, navbar: "admin" });
};

module.exports.renderNewUserForm = async (req, res) => {
  const page = "new";
  res.render("admin/users/new", { page, navbar: "admin" });
};

module.exports.newUser = async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.redirect("/api/v1/admin/users");
  // res.render("admin/users", { user, page });
};

module.exports.deleteUsers = async (req, res) => {
  try {
    console.log("deleteUsers");
    const { users } = req.body;
    console.log("users: ", users);
    console.log("users: ", req.body);
    console.log("user company: ", req.user.company);

    for (let id of users) {
      console.log("id: ", id);
      await User.findOneAndUpdate(
        {
          _id: id,
          company: req.user.company,
        },
        { $set: { deleted: true } }
      );
    }

    // company !== user.company ||
    // await User.deleteMany({ _id: { $in: users } });

    // res.send({ data: "done" });

    res.status(200).json({
      message: "Users deleted!",
    });
  } catch (e) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view this page" });
  }

  // await User.findByIdAndDelete(userId);
  // res.redirect("/api/v1/admin/users");
};

//   // req.body.company = user.company;
//   req.query.company = user.company;
//   req.params.company = user.company;
