import { useEffect, useState } from 'react';
import { ProjectService } from '@/services';
import type { Project } from '@/services/types';
import { useNavigate } from 'react-router';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await ProjectService.getAll();
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      await ProjectService.create({ name, description });
      await loadProjects();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <CreateProjectDialog onCreateProject={handleCreateProject} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(projects) &&
          projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/projects/${project.id}/matrices`)}
            >
              <h2 className="text-xl font-semibold">{project.name}</h2>
              {project.description && <p className="text-gray-600 mt-2">{project.description}</p>}
            </div>
          ))}
      </div>
    </div>
  );
}
