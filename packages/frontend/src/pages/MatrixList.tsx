import { Link, useParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MatrixList = () => {
  const { projectId } = useParams();
  const matrices = [
    { id: '1', name: 'Matrix 1', description: 'Description 1' },
    { id: '2', name: 'Matrix 2', description: 'Description 2' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Matrices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matrices.map((matrix) => (
          <Card key={matrix.id}>
            <CardHeader>
              <CardTitle>
                <Link to={`/projects/${projectId}/matrices/${matrix.id}`}>
                  {matrix.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{matrix.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatrixList;
