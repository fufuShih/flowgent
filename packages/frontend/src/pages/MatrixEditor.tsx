import { useParams } from 'react-router';
import { FlowEditor } from "@/components/FlowEditor";

const MatrixEditor = () => {
  const { matrixId } = useParams();

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Matrix Editor</h2>
        <p className="text-sm text-gray-500">Matrix ID: {matrixId}</p>
      </div>
      <div className="h-[calc(100vh-200px)]">
        <FlowEditor />
      </div>
    </div>
  );
};

export default MatrixEditor;
