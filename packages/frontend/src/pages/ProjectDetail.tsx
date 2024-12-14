import { Outlet, useParams } from 'react-router';

const ProjectDetail = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Project {projectId}</h1>
      <Outlet />
    </div>
  );
};

export default ProjectDetail;
