import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MatrixService } from '@/services/matrix.service';
import { CreateMatrixDialog } from '@/components/matrix/CreateMatrixDialog';
import { Matrix, CreateMatrixDto } from '@/types';

const MatrixListPage = () => {
  const { projectId } = useParams();
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatrices = async () => {
      try {
        const data = await MatrixService.getAll(projectId!);
        setMatrices(data);
      } catch {
        setError('Failed to fetch matrices');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrices();
  }, [projectId]);

  const handleCreateMatrix = async (data: CreateMatrixDto) => {
    try {
      const newMatrix = await MatrixService.create(projectId!, data);
      setMatrices([...matrices, newMatrix]);
    } catch {
      setError('Failed to create matrix');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Matrices</h2>
        <CreateMatrixDialog onSubmit={handleCreateMatrix} />
      </div>
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
              <p className="text-sm text-gray-600 mb-2">{matrix.description}</p>
              <p className="text-xs text-gray-500">Created: {new Date(matrix.created).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">Updated: {new Date(matrix.updated).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatrixListPage;