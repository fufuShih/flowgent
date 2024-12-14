import { Card, CardContent } from '@/components/ui/card';

const LogPage = () => {
  const logs = [
    { id: '1', timestamp: '2024-03-14 10:00:00', event: 'Matrix execution completed', level: 'info' },
    { id: '2', timestamp: '2024-03-14 09:55:00', event: 'Node processing started', level: 'debug' },
  ];

  return (
    <div className="space-y-4 w-full p-4">
      <h1 className="text-2xl font-bold">System Logs</h1>
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{log.event}</p>
                  <p className="text-sm text-gray-500">{log.timestamp}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                  log.level === 'debug' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {log.level}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LogPage;
