import { FieldType } from './record';

export interface TemplateLayout {
  type: FieldType;
  layout: {
    row: number;
    col: number;
    span: number;
  };
}

export interface TemplateRecord {
  id: string;
  title: string;
  description?: string;
  blocks: TemplateLayout[];
  icon?: React.ElementType;
}
