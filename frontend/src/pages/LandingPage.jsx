import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  KanbanSquare,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Navigation */}
      <header className="h-20 border-b border-gray-100 dark:border-dark-border/60 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 font-extrabold text-2xl tracking-tight">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
            <Layers className="w-6 h-6" />
          </div>
          <span>Task<span className="text-primary-500">Flow</span></span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 rounded-xl transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl shadow-md shadow-primary-500/25 transition-all hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24 relative overflow-hidden">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/15 dark:bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CodeAlpha Internship Full-Stack Project</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-[1.15]">
            Manage Projects & Team Workflows with <span className="bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent">Zero Friction</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            TaskFlow is a high-performance project management workspace featuring interactive Kanban boards, team collaboration, live task comments, and real-time MongoDB Atlas persistence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/30 transition-all hover:scale-105"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-surface text-gray-800 dark:text-gray-200 font-bold rounded-2xl border border-gray-200 dark:border-dark-border transition-all"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className="mt-24 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="glass-card p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
              <KanbanSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interactive Kanban</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Visualize task progression across To Do, In Progress, and Completed stages with seamless status updates and priority categorization.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Team Collaboration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Invite team members by email, assign tasks with member validation, manage permission roles, and collaborate via task comments.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Actionable Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Real-time progress percentage tracking, overdue task alerts, milestone deadlines, and complete project activity logs.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-dark-border/60 py-8 px-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© 2026 TaskFlow. CodeAlpha Full-Stack Internship Assignment.</p>
      </footer>
    </div>
  );
};
