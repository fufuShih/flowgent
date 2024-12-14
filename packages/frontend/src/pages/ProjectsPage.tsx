import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { Project, ProjectService, CreateProjectDto } from '@/services';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setProjects(ProjectService.getAll());
  };

  const handleCreateProject = (name: string) => {
    const createDto: CreateProjectDto = {
      name,
      matrices: []
    };
    ProjectService.create(createDto);
    loadProjects();
  };

  const handleDeleteProject = (id: string) => {
    ProjectService.delete(id);
    loadProjects();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <CreateProjectDialog onCreateProject={handleCreateProject} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/projects/${project.id}/matrices`)}
          >
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Created: {new Date(project.created).toLocaleDateString()}</p>
              <p>Updated: {new Date(project.updated).toLocaleDateString()}</p>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
