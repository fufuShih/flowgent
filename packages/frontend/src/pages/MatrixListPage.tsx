import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreateMatrixDialog } from '@/components/matrix/CreateMatrixDialog';
import { Matrix, MatrixService } from '@/services';

const MatrixListPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatrices = async () => {
      if (!projectId) return;

      try {
        const data = await MatrixService.getAll(projectId);
        setMatrices(data);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch matrices');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrices();
  }, [projectId]);

  const handleCreateMatrix = async (data: { name: string; description?: string }) => {
    if (!projectId) return;

    try {
      const newMatrix = await MatrixService.create(projectId, {
        ...data,
        projectId,
      });
      setMatrices([...matrices, newMatrix]);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create matrix');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!projectId) return <div>Invalid project ID</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Matrices</h2>
        <CreateMatrixDialog onSubmit={handleCreateMatrix} projectId={projectId} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matrices.map((matrix) => (
          <Card
            key={matrix.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/projects/${projectId}/matrices/${matrix.id}`)}
          >
            <CardHeader>
              <CardTitle>{matrix.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {matrix.description && (
                <p className="text-sm text-gray-600 mb-2">{matrix.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Created: {new Date(matrix.created).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(matrix.updated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatrixListPage;
