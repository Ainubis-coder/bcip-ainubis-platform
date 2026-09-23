export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  domain: 'maintenance' | 'finance' | 'governance' | 'compliance' | 'general';
  template: string;
  inputVariables: string[];
  systemRole: string;
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    this.templates.set('levy-anomaly-detection', {
      id: 'levy-anomaly-detection',
      name: 'Levy Payment Anomaly Detection',
      version: '1.0.0',
      domain: 'finance',
      template: 'Analyze transaction variance for scheme {{schemeName}} against historical benchmark {{benchmark}}.',
      inputVariables: ['schemeName', 'benchmark'],
      systemRole: 'You are Ainubis, an enterprise property management financial intelligence assistant.',
    });
  }

  public getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  public render(id: string, variables: Record<string, string>): string {
    const template = this.getTemplate(id);
    if (!template) throw new Error(`Prompt template ${id} not found`);

    let output = template.template;
    for (const [key, value] of Object.entries(variables)) {
      output = output.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return output;
  }
}

export const promptManager = new PromptManager();
