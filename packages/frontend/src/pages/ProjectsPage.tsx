
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router';

const ProjectsPage = () => {
  const projects = [
    { id: '1', name: 'Project 1', description: 'Description 1' },
    { id: '2', name: 'Project 2', description: 'Description 2' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>
                <Link to={`/projects/${project.id}/matrices`}>{project.name}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{project.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
