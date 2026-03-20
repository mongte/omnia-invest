"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Plus } from 'lucide-react';
import { useProjectStore } from '@/entities/project/model/store';

export const CreateProjectDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('blue');
  const createProject = useProjectStore(state => state.createProject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    await createProject({ title, color, icon: 'Folder' });
    setOpen(false);
    setTitle('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Name</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Project Alpha" 
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Theme Color</Label>
            <select 
              id="color"
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="blue">Blue</option>
              <option value="orange">Orange</option>
              <option value="purple">Purple</option>
              <option value="emerald">Emerald</option>
              <option value="rose">Rose</option>
            </select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
