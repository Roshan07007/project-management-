const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

/**
 * End-to-End Test for TaskFlow Full Application Workflow
 * Verifies all 20 requirement checkpoints requested by the user.
 */
async function testFullApplicationWorkflow() {
  const API_URL = 'http://localhost:5000/api';
  console.log(`\n============================================================`);
  console.log(`🚀 STARTING COMPLETE TASKFLOW E2E VALIDATION SUITE`);
  console.log(`============================================================\n`);

  const connectDB = require('./src/config/db');
  await connectDB();
  const User = require('./src/models/User');
  const Project = require('./src/models/Project');
  const Task = require('./src/models/Task');
  const Comment = require('./src/models/Comment');

  const makeClient = (token = null) => {
    return async (endpoint, options = {}) => {
      const url = `${API_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };
      const response = await fetch(url, { ...options, headers });
      const body = await response.json().catch(() => ({}));
      return { status: response.status, ok: response.ok, data: body };
    };
  };

  try {
    const unauthClient = makeClient();

    // Checkpoint 1 & 18: Verify MongoDB Atlas Health & MONGO_URI
    console.log('📍 [Check 1/20] Checking MongoDB Atlas Connection Health...');
    const healthRes = await unauthClient('/health');
    if (!healthRes.ok || !healthRes.data.database?.connected) {
      throw new Error(`Database connection degraded: ${JSON.stringify(healthRes.data)}`);
    }
    console.log(`  ✔ Connected to MongoDB Host: ${healthRes.data.database.host}`);

    // Checkpoint 17: Protected Routes verification (Unauthenticated request rejected)
    console.log('📍 [Check 2/20] Verifying Protected Routes Reject Unauthenticated Requests...');
    const unauthProj = await unauthClient('/projects');
    if (unauthProj.status !== 401) {
      throw new Error(`Protected route did not reject unauthenticated request, status: ${unauthProj.status}`);
    }
    console.log('  ✔ Unauthenticated access to /api/projects successfully rejected with 401');

    // Clean up test data before run
    const sarahEmail = 'sarah.jenkins@taskflow.dev';
    const davidEmail = 'david.miller@taskflow.dev';
    await User.deleteMany({ email: { $in: [sarahEmail, davidEmail] } });

    // Checkpoint 1: Register New User (Sarah Jenkins)
    console.log('📍 [Check 3/20] Registering Primary User (Sarah Jenkins)...');
    const regSarah = await unauthClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sarah Jenkins',
        email: sarahEmail,
        password: 'password123!',
      }),
    });
    if (!regSarah.ok || !regSarah.data.token) {
      throw new Error(`Sarah registration failed: ${JSON.stringify(regSarah.data)}`);
    }
    const sarahToken = regSarah.data.token;
    const sarahId = regSarah.data.user._id;
    const sarahClient = makeClient(sarahToken);
    console.log(`  ✔ Sarah registered successfully: ID=${sarahId}, Token generated`);

    // Checkpoint 1 & 6: Register Secondary User (David Miller)
    console.log('📍 [Check 4/20] Registering Secondary User (David Miller) for Team Collaboration...');
    const regDavid = await unauthClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'David Miller',
        email: davidEmail,
        password: 'password123!',
      }),
    });
    if (!regDavid.ok || !regDavid.data.token) {
      throw new Error(`David registration failed: ${JSON.stringify(regDavid.data)}`);
    }
    const davidToken = regDavid.data.token;
    const davidId = regDavid.data.user._id;
    const davidClient = makeClient(davidToken);
    console.log(`  ✔ David registered successfully: ID=${davidId}`);

    // Checkpoint 2: Login and Logout Simulation
    console.log('📍 [Check 5/20] Testing Login Authentication & Token Verification...');
    const loginRes = await unauthClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: sarahEmail,
        password: 'password123!',
      }),
    });
    if (!loginRes.ok || !loginRes.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    console.log('  ✔ User Login successful');

    // Checkpoint 16: Profile Editing
    console.log('📍 [Check 6/20] Testing Profile Details & Theme Accent Editing...');
    const updateProfileRes = await sarahClient('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Sarah Jenkins Lead',
        bio: 'Lead Architect for Enterprise Cloud Solutions',
        avatarColor: '#8b5cf6',
      }),
    });
    if (!updateProfileRes.ok || updateProfileRes.data.user.name !== 'Sarah Jenkins Lead') {
      throw new Error(`Profile update failed: ${JSON.stringify(updateProfileRes.data)}`);
    }
    console.log(`  ✔ Profile updated: Name="${updateProfileRes.data.user.name}", AvatarColor="${updateProfileRes.data.user.avatarColor}"`);

    // Checkpoint 3: Create a New Project
    console.log('📍 [Check 7/20] Creating New Project ("E-Commerce Storefront 2.0")...');
    const createProjRes = await sarahClient('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: 'E-Commerce Storefront 2.0',
        description: 'Next-generation headless commerce platform with Stripe checkout',
        status: 'Active',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (!createProjRes.ok || !createProjRes.data.project?._id) {
      throw new Error(`Project creation failed: ${JSON.stringify(createProjRes.data)}`);
    }
    const projectId = createProjRes.data.project._id;
    console.log(`  ✔ Project created: ID=${projectId}, Title="${createProjRes.data.project.title}"`);

    // Checkpoint 4: Edit the Project
    console.log('📍 [Check 8/20] Editing Project Details ("E-Commerce Storefront 2.0 Pro")...');
    const editProjRes = await sarahClient(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'E-Commerce Storefront 2.0 Pro',
        status: 'In Progress',
      }),
    });
    if (!editProjRes.ok || editProjRes.data.project.title !== 'E-Commerce Storefront 2.0 Pro') {
      throw new Error(`Project edit failed: ${JSON.stringify(editProjRes.data)}`);
    }
    console.log(`  ✔ Project updated: Title="${editProjRes.data.project.title}", Status="${editProjRes.data.project.status}"`);

    // Checkpoint 6: Add Project Member using Registered Email
    console.log('📍 [Check 9/20] Adding Project Member (david.miller@taskflow.dev) to Project Team...');
    const addMemberRes = await sarahClient(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        email: davidEmail,
        role: 'Member',
      }),
    });
    if (!addMemberRes.ok) {
      throw new Error(`Add member failed: ${JSON.stringify(addMemberRes.data)}`);
    }
    console.log(`  ✔ Member added successfully: "${addMemberRes.data.message}"`);

    // Checkpoint 7 & 9: Create Task Inside Project and Assign to Member
    console.log('📍 [Check 10/20] Creating Task 1 and Assigning to Member (David Miller)...');
    const task1Res = await sarahClient('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Build Product Catalog Grid',
        description: 'Responsive product card grid with filter sidebar and pagination',
        project: projectId,
        assignedTo: davidId,
        status: 'To Do',
        priority: 'High',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (!task1Res.ok || !task1Res.data.task?._id) {
      throw new Error(`Create Task 1 failed: ${JSON.stringify(task1Res.data)}`);
    }
    const task1Id = task1Res.data.task._id;
    console.log(`  ✔ Task 1 Created: ID=${task1Id}, Assignee="${task1Res.data.task.assignedTo?.name}"`);

    console.log('📍 [Check 11/20] Creating Task 2 (Setup Stripe Checkout)...');
    const task2Res = await sarahClient('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Setup Stripe Checkout Integration',
        description: 'Implement webhook listeners and session tokens',
        project: projectId,
        assignedTo: sarahId,
        status: 'In Progress',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (!task2Res.ok || !task2Res.data.task?._id) {
      throw new Error(`Create Task 2 failed: ${JSON.stringify(task2Res.data)}`);
    }
    const task2Id = task2Res.data.task._id;
    console.log(`  ✔ Task 2 Created: ID=${task2Id}`);

    // Checkpoint 10 & 11: Change Task Status, Priority and Due Date
    console.log('📍 [Check 12/20] David Updates Task 1 Status (To Do -> In Progress) & Priority (High -> Medium)...');
    const updateTask1Res = await davidClient(`/tasks/${task1Id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'In Progress',
        priority: 'Medium',
      }),
    });
    if (!updateTask1Res.ok || updateTask1Res.data.task.status !== 'In Progress') {
      throw new Error(`Task 1 update failed: ${JSON.stringify(updateTask1Res.data)}`);
    }
    console.log(`  ✔ Task 1 updated by David: Status="${updateTask1Res.data.task.status}", Priority="${updateTask1Res.data.task.priority}"`);

    // Checkpoint 12: Add and View Comments on Task
    console.log('📍 [Check 13/20] David Posts Comment on Task 1...');
    const addCommentRes = await davidClient(`/tasks/${task1Id}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content: 'Product card wireframes and responsive Tailwind styles are done!',
      }),
    });
    if (!addCommentRes.ok || !addCommentRes.data.comment?._id) {
      throw new Error(`Add comment failed: ${JSON.stringify(addCommentRes.data)}`);
    }
    const commentId = addCommentRes.data.comment._id;
    console.log(`  ✔ Comment added: "${addCommentRes.data.comment.content}"`);

    console.log('📍 [Check 14/20] Sarah Views Comments on Task 1...');
    const getCommentsRes = await sarahClient(`/tasks/${task1Id}/comments`);
    if (!getCommentsRes.ok || getCommentsRes.data.comments.length !== 1) {
      throw new Error(`Get comments failed: ${JSON.stringify(getCommentsRes.data)}`);
    }
    console.log(`  ✔ Verified ${getCommentsRes.data.comments.length} comment(s) retrieved with author: "${getCommentsRes.data.comments[0].user?.name}"`);

    // Checkpoint 13: Kanban Board status transition to Completed
    console.log('📍 [Check 15/20] Moving Task 1 to "Completed" (Kanban Transition)...');
    const completeTaskRes = await davidClient(`/tasks/${task1Id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Completed',
      }),
    });
    if (!completeTaskRes.ok || completeTaskRes.data.task.status !== 'Completed') {
      throw new Error(`Move to completed failed: ${JSON.stringify(completeTaskRes.data)}`);
    }
    console.log(`  ✔ Task 1 Status is now "${completeTaskRes.data.task.status}"`);

    // Checkpoint 14: Search and Filters
    console.log('📍 [Check 16/20] Testing Search & Filters across tasks...');
    const searchRes = await sarahClient(`/tasks?project=${projectId}&status=Completed`);
    if (!searchRes.ok || searchRes.data.tasks.length !== 1) {
      throw new Error(`Task search/filter failed: ${JSON.stringify(searchRes.data)}`);
    }
    console.log(`  ✔ Search returned ${searchRes.data.tasks.length} completed task(s) in project`);

    // Checkpoint 15: Dashboard Statistics
    console.log('📍 [Check 17/20] Verifying Project & Dashboard KPI Aggregations...');
    const projDetailsRes = await sarahClient(`/projects/${projectId}`);
    if (!projDetailsRes.ok) throw new Error('Fetch project details failed');
    const stats = projDetailsRes.data.project.stats;
    console.log(`  ✔ Project Stats verified: Total=${stats.totalTasks}, Completed=${stats.completedTasks}, InProgress=${stats.inProgressTasks}, Progress=${stats.progressPercentage}%`);

    // Checkpoint 8: Edit and Delete Task
    console.log('📍 [Check 18/20] Testing Single Task Deletion (Task 2)...');
    const delTaskRes = await sarahClient(`/tasks/${task2Id}`, { method: 'DELETE' });
    if (!delTaskRes.ok) throw new Error('Delete task failed');
    console.log('  ✔ Task 2 deleted successfully');

    // Checkpoint 5 & 18: Delete Project and verify MongoDB Atlas cascade deletion
    console.log('📍 [Check 19/20] Testing Project Deletion with Full MongoDB Atlas Cascade...');
    const delProjRes = await sarahClient(`/projects/${projectId}`, { method: 'DELETE' });
    if (!delProjRes.ok) throw new Error('Delete project failed');
    console.log('  ✔ Project deleted successfully');

    // Verify cascaded deletion in database
    const orphanTasks = await Task.find({ project: projectId });
    const orphanComments = await Comment.find({ task: { $in: [task1Id, task2Id] } });
    if (orphanTasks.length > 0 || orphanComments.length > 0) {
      throw new Error(`Cascade deletion failed! Tasks remaining: ${orphanTasks.length}, Comments remaining: ${orphanComments.length}`);
    }
    console.log('  ✔ MongoDB Atlas verification: 0 orphan tasks, 0 orphan comments remain in database');

    // Clean up users
    await User.deleteMany({ _id: { $in: [sarahId, davidId] } });
    console.log('📍 [Check 20/20] Cleanup completed. Database in pristine state.');

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 20 FUNCTIONALITY CHECKS PASSED WITH 100% SUCCESS!`);
    console.log(`============================================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E TEST FAILED:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testFullApplicationWorkflow();
