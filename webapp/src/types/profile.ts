export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  grade?: string;
}

export interface UserProfile {
  name: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  years_of_experience: number;
  certifications: string[];
  languages: string[];
}
