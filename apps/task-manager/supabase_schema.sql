-- Create Tasks Table
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
    assignee_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a real app we would enable RLS and add policies, for this prototype we are skipping RLS
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read/write" ON public.tasks FOR ALL USING (true);

-- Create Agents Table (Optional for now since Assignee is text in tasks, but good to have)
CREATE TABLE public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    current_task_id UUID REFERENCES public.tasks(id),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
