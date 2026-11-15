export type CourseItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  duration_months: number;
  total_modules?: number;
  fee: number | string;
  learning_mode: string;
  image?: string;
  skills_covered?: string;
  level?: string;
  key_tech?: string[];
  modules: Array<{
    id: number;
    title: string;
    description?: string;
    duration_hours?: number;
  }>;
};
