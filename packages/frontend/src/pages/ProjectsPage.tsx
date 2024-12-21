import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { Project, ProjectService } from '@/services';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const data = await ProjectService.getAll();
      setProjects(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (name: string) => {
    try {
      await ProjectService.create({ name });
      await loadProjects();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await ProjectService.delete(id);
      await loadProjects();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

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
              {project.description && (
                <p className="text-sm text-gray-600 mb-2">{project.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Created: {new Date(project.created).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(project.updated).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id.toString());
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
