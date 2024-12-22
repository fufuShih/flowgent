import type { Node } from '../../openapi-client/types.gen';

interface NodeTemplate {
  type: Node['type'];
  data: {
    name: string;
    label: string;
    description?: string;
    config: {
      template: true;
      templateId: string;
      [key: string]: unknown;
    };
  };
}

export const nodeTemplates: Record<string, NodeTemplate> = {
  httpTrigger: {
    type: 'trigger',
    data: {
      name: 'HTTP Trigger',
      label: 'HTTP Webhook',
      description: 'Triggers flow on HTTP request',
      config: {
        template: true,
        templateId: 'httpTrigger',
        type: 'webhook',
        method: 'POST',
        path: '/webhook',
        headers: {},
      },
    },
  },
  scheduleTrigger: {
    type: 'trigger',
    data: {
      name: 'Schedule Trigger',
      label: 'Schedule',
      description: 'Triggers flow on schedule',
      config: {
        template: true,
        templateId: 'scheduleTrigger',
        type: 'schedule',
        cron: '0 0 * * *',
        timezone: 'UTC',
      },
    },
  },
  httpRequest: {
    type: 'action',
    data: {
      name: 'HTTP Request',
      label: 'HTTP Request',
      description: 'Make HTTP request to external service',
      config: {
        template: true,
        templateId: 'httpRequest',
        method: 'GET',
        url: '',
        headers: {},
        body: {},
      },
    },
  },
  dataCondition: {
    type: 'condition',
    data: {
      name: 'Data Condition',
      label: 'Data Check',
      description: 'Check data conditions',
      config: {
        template: true,
        templateId: 'dataCondition',
        operator: 'equals',
        field: '',
        value: '',
      },
    },
  },
  dataMapper: {
    type: 'transformer',
    data: {
      name: 'Data Mapper',
      label: 'Map Data',
      description: 'Transform data structure',
      config: {
        template: true,
        templateId: 'dataMapper',
        mappings: {},
      },
    },
  },
  forEach: {
    type: 'loop',
    data: {
      name: 'For Each',
      label: 'For Each Loop',
      description: 'Iterate over array items',
      config: {
        template: true,
        templateId: 'forEach',
        arrayPath: '',
        maxIterations: 100,
      },
    },
  },
};

export type NodeTemplateKey = keyof typeof nodeTemplates;
