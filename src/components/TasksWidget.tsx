import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Check } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Follow up with Alice Smith', completed: false },
  { id: '2', title: 'Schedule site visit for Charlie Davis', completed: false },
  { id: '3', title: 'Prepare documents for Bob Johnson', completed: false },
];

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));

    // If marked as completed, remove it after a short delay
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== id));
      }, 800);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tasks</h3>
            <p className="text-xs text-slate-500">Your daily to-dos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[250px]">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-full text-center p-4"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-4" />
              <p className="text-sm font-bold text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-500">You have completed all your tasks.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    task.completed 
                      ? 'bg-emerald-50 border-emerald-100' 
                      : 'bg-slate-50 border-slate-100 hover:border-indigo-100 hover:bg-white'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="relative flex-shrink-0">
                    <motion.div
                      initial={false}
                      animate={{ scale: task.completed ? 1 : 0, opacity: task.completed ? 1 : 0 }}
                      className="absolute inset-0 text-emerald-500"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{ scale: task.completed ? 0 : 1, opacity: task.completed ? 0 : 1 }}
                      className="text-slate-300"
                    >
                      <Circle className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <span className={`text-sm font-medium transition-all ${
                    task.completed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'
                  }`}>
                    {task.title}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
