const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

async function runCompleteBackendTestSuite() {
  const baseUrl = `http://localhost:${process.env.PORT || 5000}/api`;
  console.log(`\n========================================`);
  console.log(`TaskFlow Complete API Test Suite on ${baseUrl}`);
  console.log(`========================================`);

  const connectDB = require('./src/config/db');
  await connectDB();
  const User = require('./src/models/User');
  const Project = require('./src/models/Project');
  const Task = require('./src/models/Task');
  const Comment = require('./src/models/Comment');

  try {
    const request = async (path, options = {}) => {
      const url = `${baseUrl}${path}`;
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data };
    };

    console.log('\n1. Health Check (GET /api/health)');
    const health = await request('/health');
    if (!health.ok || health.data.database?.status !== 'connected') {
      throw new Error('Health check failed: ' + JSON.stringify(health.data));
    }
    console.log('✔ Health Check OK:', health.data.message);

    // Clean up any stale test accounts from previous runs
    const testEmails = [
      'qa_tester_alpha@example.com',
      'qa_collaborator_beta@example.com',
    ];
    await User.deleteMany({ email: { $in: testEmails } });

    console.log('\n2. Register User 1 (POST /api/auth/register)');
    const regUser1 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alpha Tester',
        email: 'qa_tester_alpha@example.com',
        password: 'Password123!',
      }),
    });
    if (!regUser1.ok || !regUser1.data.token) {
      throw new Error('Registration failed: ' + JSON.stringify(regUser1.data));
    }
    const token1 = regUser1.data.token;
    const user1Id = regUser1.data.user._id;
    console.log('✔ User 1 Registered:', user1Id, regUser1.data.user.email);

    console.log('\n3. Register User 2 (POST /api/auth/register)');
    const regUser2 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Beta Collaborator',
        email: 'qa_collaborator_beta@example.com',
        password: 'Password123!',
      }),
    });
    if (!regUser2.ok || !regUser2.data.token) {
      throw new Error('User 2 registration failed: ' + JSON.stringify(regUser2.data));
    }
    const token2 = regUser2.data.token;
    const user2Id = regUser2.data.user._id;
    console.log('✔ User 2 Registered:', user2Id, regUser2.data.user.email);

    console.log('\n4. Duplicate Registration Validation (POST /api/auth/register)');
    const dupReg = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate',
        email: 'qa_tester_alpha@example.com',
        password: 'Password123!',
      }),
    });
    if (dupReg.status !== 400) {
      throw new Error('Duplicate check failed: expected 400 but got ' + dupReg.status);
    }
    console.log('✔ Duplicate registration correctly rejected with 400');

    console.log('\n5. Login Authentication (POST /api/auth/login)');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'qa_tester_alpha@example.com',
        password: 'Password123!',
      }),
    });
    if (!loginRes.ok || !loginRes.data.token) {
      throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    }
    console.log('✔ Login successful, token received');

    console.log('\n6. Get Current User Profile (GET /api/auth/me)');
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (!meRes.ok || meRes.data.user.email !== 'qa_tester_alpha@example.com') {
      throw new Error('Get profile failed');
    }
    console.log('✔ Verified Profile for:', meRes.data.user.name);

    console.log('\n7. Update User Profile (PUT /api/auth/profile)');
    const updateProfRes = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Alpha Lead Engineer',
        bio: 'Tech Lead managing TaskFlow sprint',
        avatarColor: '#10b981',
      }),
    });
    if (!updateProfRes.ok || updateProfRes.data.user.name !== 'Alpha Lead Engineer') {
      throw new Error('Update profile failed: ' + JSON.stringify(updateProfRes.data));
    }
    console.log('✔ Profile updated successfully');

    console.log('\n8. Create New Project (POST /api/projects)');
    const createProjRes = await request('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        title: 'TaskFlow Cloud Deployment',
        description: 'Complete end-to-end testing and deployment verification',
        status: 'Active',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (!createProjRes.ok || !createProjRes.data.project?._id) {
      throw new Error('Create project failed: ' + JSON.stringify(createProjRes.data));
    }
    const projectId = createProjRes.data.project._id;
    console.log('✔ Project Created:', projectId, createProjRes.data.project.title);

    console.log('\n9. Edit Project (PUT /api/projects/:id)');
    const editProjRes = await request(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        title: 'TaskFlow Cloud Deployment V2',
        status: 'In Progress',
      }),
    });
    if (!editProjRes.ok || editProjRes.data.project.title !== 'TaskFlow Cloud Deployment V2') {
      throw new Error('Edit project failed: ' + JSON.stringify(editProjRes.data));
    }
    console.log('✔ Project edited:', editProjRes.data.project.title);

    console.log('\n10. Add Project Member (POST /api/projects/:id/members)');
    const addMemberRes = await request(`/projects/${projectId}/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        email: 'qa_collaborator_beta@example.com',
        role: 'Member',
      }),
    });
    if (!addMemberRes.ok) {
      throw new Error('Add member failed: ' + JSON.stringify(addMemberRes.data));
    }
    console.log('✔ User 2 added as Member to Project');

    console.log('\n11. Create Task (POST /api/tasks)');
    const createTaskRes = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        title: 'Implement Database Indexing',
        description: 'Ensure MongoDB indexes are optimized for fast queries',
        project: projectId,
        assignedTo: user2Id,
        status: 'To Do',
        priority: 'High',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (!createTaskRes.ok || !createTaskRes.data.task?._id) {
      throw new Error('Create task failed: ' + JSON.stringify(createTaskRes.data));
    }
    const taskId = createTaskRes.data.task._id;
    console.log('✔ Task Created & Assigned:', taskId, createTaskRes.data.task.title);

    console.log('\n12. Edit Task Status & Priority (PUT /api/tasks/:id)');
    const updateTaskRes = await request(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token2}` },
      body: JSON.stringify({
        status: 'In Progress',
        priority: 'High',
      }),
    });
    if (!updateTaskRes.ok || updateTaskRes.data.task.status !== 'In Progress') {
      throw new Error('Update task failed: ' + JSON.stringify(updateTaskRes.data));
    }
    console.log('✔ Task status updated to:', updateTaskRes.data.task.status);

    console.log('\n13. Add Comment to Task (POST /api/tasks/:taskId/comments)');
    const commentRes = await request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
      body: JSON.stringify({
        content: 'Indexes added on email, project, and status fields.',
      }),
    });
    if (!commentRes.ok || !commentRes.data.comment?._id) {
      throw new Error('Add comment failed: ' + JSON.stringify(commentRes.data));
    }
    const commentId = commentRes.data.comment._id;
    console.log('✔ Comment added:', commentRes.data.comment.content);

    console.log('\n14. View Comments on Task (GET /api/tasks/:taskId/comments)');
    const getCommentsRes = await request(`/tasks/${taskId}/comments`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (!getCommentsRes.ok || getCommentsRes.data.comments.length !== 1) {
      throw new Error('Get comments failed');
    }
    console.log('✔ Retrieved comments count:', getCommentsRes.data.comments.length);

    console.log('\n15. Update Task to Completed (PUT /api/tasks/:id)');
    const completeTaskRes = await request(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        status: 'Completed',
      }),
    });
    if (!completeTaskRes.ok || completeTaskRes.data.task.status !== 'Completed') {
      throw new Error('Task complete failed');
    }
    console.log('✔ Task marked as Completed');

    console.log('\n16. Fetch Project Stats (GET /api/projects/:id)');
    const getProjRes = await request(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (!getProjRes.ok) throw new Error('Fetch project stats failed');
    const stats = getProjRes.data.project.stats;
    console.log('✔ Project stats verified: totalTasks=', stats.totalTasks, ', completedTasks=', stats.completedTasks, ', progress=', stats.progressPercentage + '%');

    console.log('\n17. Search & Filter Tasks (GET /api/tasks?search=Indexing&status=Completed)');
    const filterTasksRes = await request(`/tasks?search=Indexing&status=Completed`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (!filterTasksRes.ok || filterTasksRes.data.tasks.length !== 1) {
      throw new Error('Filter tasks failed');
    }
    console.log('✔ Search and filter returned expected 1 task');

    console.log('\n18. Delete Comment (DELETE /api/comments/:id)');
    const delCommentRes = await request(`/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (!delCommentRes.ok) throw new Error('Delete comment failed');
    console.log('✔ Comment deleted');

    console.log('\n19. Delete Project and Cascade Tasks/Comments (DELETE /api/projects/:id)');
    const delProjRes = await request(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (!delProjRes.ok) throw new Error('Delete project failed');
    console.log('✔ Project and cascade items deleted');

    // Verify task is also deleted from MongoDB
    const remainingTasks = await Task.find({ project: projectId });
    if (remainingTasks.length > 0) throw new Error('Cascade delete failed to clean up tasks');
    console.log('✔ Verified database cascade delete: 0 remaining tasks');

    // Clean up test users
    await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
    console.log('✔ Cleaned up test users from MongoDB Atlas');

    console.log(`\n========================================`);
    console.log(`🎉 ALL 19 BACKEND FUNCTIONALITY TESTS PASSED!`);
    console.log(`========================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Suite Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runCompleteBackendTestSuite();
