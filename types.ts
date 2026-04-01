export interface NavItem {
  label: string;
  href: string;
}

export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface MetricData {
  name: string;
  value: number;
  fullMark: number;
  fill?: string;
}

export interface DetectionObject {
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
}
