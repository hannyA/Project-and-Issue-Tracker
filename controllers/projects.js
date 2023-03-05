const Project = require("../models/project");
const Issue = require("../models/issue");
const User = require("../models/user");
const Task = require("../models/task");
const APIFeatures = require("../utils/apiFeatures");
const wrapAsync = require("../utils/wrapAsync");

const { getCompanyUsers } = require("./util");

// List all projects or mine projects
module.exports.index = async (req, res) => {
  const features = new APIFeatures(Project.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const projects = await features.query.populate({ path: "owner" });

  // Get number of projects and calculate number of pages
  const countQuery = new APIFeatures(Project.find(), req.query).filter();
  const numProjects = await Project.countDocuments(countQuery.query);

  // console.log("numProjects: ", numProjects);
  const totalPages = Math.ceil(numProjects / features.limit);

  const { owner } = req.query;
  // const page = owner === req.user.id ? "mine" : "index";

  let page = "index";
  let resource = "projects?";

  const ownerId = req.query.owner;
  if (ownerId && ownerId === req.user.id) {
    page = "mine";
    resource = `${resource}owner=${req.query.owner}&`;
  }

  res.render("projects/index", {
    pagination: true,
    projects,
    page,
    totalPages,
    currentPage: features.page,
    resource,
  });
};

module.exports.renderNewProjectForm = async (req, res) => {
  const users = await getCompanyUsers(req, res);
  const page = "new";
  res.render("projects/new", { page, users });
};

module.exports.createProject = async (req, res) => {
  console.log(req.body);
  console.log(req.body.project);

  const project = new Project(req.body);
  await project.save();
  res.redirect(`/api/v1/projects/${project._id}`);
};

// Show project details with first 10 issues
module.exports.showProject = wrapAsync(async (req, res) => {
  const projectID = req.params.projectId;
  const project = await Project.findById(projectID).populate("owner");

  // const issues = await Issue.find({ project: projectID }).populate("author");

  req.query.project = projectID;
  console.log("query: ", req.query);
  const features = new APIFeatures(Issue.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const issues = await features.query.populate("author");

  // console.log("issues: ", issues);
  // Get number of projects and calculate number of pages
  const countQuery = new APIFeatures(Issue.find(), req.query).filter();
  const numIssues = await Issue.countDocuments(countQuery.query);

  // console.log("numProjects: ", numProjects);
  const totalPages = Math.ceil(numIssues / features.limit);

  // const { owner } = req.query;
  // const page = owner === req.user.id ? "mine" : "index";

  const page = "show";

  res.render("projects/show", {
    // pagination: true,
    project,
    issues,
    page,
    totalPages,
    currentPage: features.page,
    resource: `projects/${projectID}?`,
  });

  // res.render("projects/show", { project, issues, totalPages, page });
});

module.exports.error = async (req, res) => {
  res.render("templates/errors/signedin-error-template");
};

// Show edit project form
module.exports.renderEditProject = async (req, res) => {
  console.log("renderEditProject");
  const { projectId } = req.params;
  const project = await Project.findById(projectId).populate("owner");
  console.log("renderEditProject 2");

  const users = await getCompanyUsers(req, res);

  const page = "edit";
  res.render("projects/edit", { project, users, page });
  // res.send("404 Need to do");
};

// Edit project
module.exports.editProject = async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findByIdAndUpdate(projectId, {
    ...req.body.project,
  });
  res.redirect(`/api/v1/projects/${projectId}`);
};

/// Show all issues
// search by tickets/issues -> author is me or some other user
module.exports.projectIssues = async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  req.query.project = projectId;

  let page = "all-issues";
  let resource = `projects/${projectId}/issues?`;

  if (req.query.author) {
    page = "mine";
    resource = `${resource}author=${req.query.author}&`;
  }

  const features = new APIFeatures(Issue.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const issues = await features.query.populate("author");

  // Get number of projects and calculate number of pages
  const countQuery = new APIFeatures(Issue.find(), req.query).filter();
  const numIssues = await Issue.countDocuments(countQuery.query);

  // console.log("numProjects: ", numProjects);
  const totalPages = Math.ceil(numIssues / features.limit);

  res.render("projects/issues/all-issues", {
    pagination: true,

    project,
    issues,
    page,
    totalPages,
    currentPage: features.page,
    resource,
  });
};

// Show single issue with tasks
module.exports.renderProjectIssue = async (req, res) => {
  const { issueId, projectId } = req.params;
  const project = await Project.findById(projectId);
  const issue = await Issue.findById(issueId).populate("author");

  req.query.issue = issueId;

  const features = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await features.query.populate("author");

  // Get number of projects and calculate number of pages
  const countQuery = new APIFeatures(Task.find(), req.query).filter();
  const numberofTasks = await Task.countDocuments(countQuery.query);

  const pagination = numberofTasks == 0 ? false : true;
  // console.log("numProjects: ", numProjects);
  const totalPages = Math.ceil(numberofTasks / features.limit);

  const page = "issue";
  let resource = `projects/${req.params.projectId}/issues/${issueId}?`;

  res.render("projects/issues/show", {
    issue,
    page,
    project,
    tasks,
    pagination: pagination,
    resource,

    totalPages,
    currentPage: features.page,
  });
};

// Show Create new Issue Form
module.exports.renderNewProjectIssue = async (req, res) => {
  console.log("renderNewProjectIssue");
  const page = "new-issue";
  const users = await getCompanyUsers(req, res);
  console.log("renderNewProjectIssue users");

  const project = await Project.findById(req.params.projectId);
  res.render("projects/issues/new-issue", { page, project, users });
};

// Create ticket and redirect
module.exports.createNewIssue = wrapAsync(async (req, res) => {
  const { projectId } = req.params;
  req.body.ticket.project = projectId;
  const ticket = new Issue(req.body.ticket);
  await ticket.save();

  res.redirect(`/api/v1/projects/${projectId}/issues/${ticket._id}`);
});

module.exports.deleteProject = wrapAsync(async (req, res) => {
  const { projectId } = req.params;
  await Project.findByIdAndDelete(projectId);
  res.redirect("/api/v1/projects");
});

module.exports.editProjectIssue = wrapAsync(async (req, res) => {
  const projectId = req.params.projectId;
  const issueId = req.params.issueId;
  const project = await Issue.findByIdAndUpdate(issueId, {
    ...req.body.ticket,
  });
  res.redirect(`/api/v1/projects/${projectId}/issues/${issueId}`);
});

module.exports.renderEditProjectIssue = wrapAsync(async (req, res) => {
  const { projectId, issueId } = req.params;

  const project = await Project.findById(projectId);
  const issue = await Issue.findById(issueId).populate("author");
  const page = "5";

  console.log("issue; ", issue);

  const users = await getCompanyUsers(req, res);
  res.render("projects/issues/edit-issue", { project, issue, page, users });
});

module.exports.renderTasks = wrapAsync(async (req, res) => {
  const projectId = req.params.projectId;
  const issuId = req.params.projectId;

  // const tasks = await Task.find({ issue });

  res.send("renderTasks", {});
});

module.exports.createNewTask = wrapAsync(async (req, res) => {
  const { projectId, issueId } = req.params;

  req.body.task.issue = issueId;
  console.log("req.body.task: ", req.body.task);
  const task = new Task(req.body.task);
  await task.save();
  res.redirect(`/api/v1/projects/${projectId}/issues/${issueId}`);
});

module.exports.renderNewTaskForm = wrapAsync(async (req, res) => {
  const { projectId, issueId } = req.params;
  const project = await Project.findById(projectId);

  const issue = await Issue.findById(issueId).populate("author");
  const users = await getCompanyUsers(req, res);
  const page = "new-task";

  res.render("projects/tasks/new", { project, issue, page, users });
});

module.exports.renderEditTaskForm = wrapAsync(async (req, res) => {
  const { projectId, issueId, taskId } = req.params;

  const project = await Project.findById(projectId);
  const issue = await Issue.findById(issueId).populate("author");
  const task = await Task.findById(taskId).populate("author");

  const users = await getCompanyUsers(req, res);
  const page = "edit-task";

  res.render("projects/tasks/edit", { project, issue, task, page, users });

  // res.send("renderNewTaskForm");
});

module.exports.updateTaskForm = wrapAsync(async (req, res) => {
  const { projectId, issueId, taskId } = req.params;

  const task = await Task.findByIdAndUpdate(taskId, {
    ...req.body.task,
  });
  res.redirect(`/api/v1/projects/${projectId}/issues/${issueId}`);
});

module.exports.deleteTask = wrapAsync(async (req, res) => {
  const { projectId, issueId, taskId } = req.params;
  const task = await Task.findByIdAndDelete(taskId);

  const page = "delete-task";
  res.redirect(`/api/v1/projects/${projectId}/issues/${issueId}`);
});
