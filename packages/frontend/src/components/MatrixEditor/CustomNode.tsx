import { Button } from '@/components/ui/button';
import type { Node } from '../../openapi-client/types.gen';

interface CustomNodeProps {
  data: Node;
  type: Node['type'];
  projectId: string;
  matrixId: string;
}

const bgColors: Record<Node['type'], string> = {
  trigger: 'bg-emerald-500',
  action: 'bg-orange-500',
  condition: 'bg-blue-500',
  subMatrix: 'bg-purple-500',
  transformer: 'bg-yellow-500',
  loop: 'bg-pink-500',
};

export const CustomNode = ({ data, type }: CustomNodeProps) => {
  const handleExecute = async () => {
    if (!data.id) return;
    try {
      console.log('Execute node:', data.id);
    } catch (error) {
      console.error(`Error executing node ${data.name}:`, error);
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md border ${bgColors[type]}`}>
      <div className="text-white font-bold">{data.name}</div>
      {data.description && <div className="text-white text-xs mt-1">{data.description}</div>}
      {data.config && Object.entries(data.config).length > 0 && (
        <div className="text-white text-xs mt-1 space-y-1">
          {Object.entries(data.config).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-white hover:text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          handleExecute();
        }}
      >
        Execute
      </Button>
    </div>
  );
};
