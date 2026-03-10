export interface User {
  userId: number;
  systemUserId: string;
  companyEmail: string;
  roleId: number;
  roleName: string;
  departmentId: number;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface Project {
  projectId: number;
  projectCode: string;
  name: string;
  departmentId: number;
  managerUserId: number;
  status: string;
  projectMembers?: ProjectMember[];
}

export interface Task {
  taskId: number;
  projectId: number;
  title: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
}

export interface Document {
  documentId: number;
  projectId: number;
  taskId: number | null;
  storageType: string;
  fileSizeBytes: number;
  internalPath: string | null;
  cloudUrl: string | null;
}

export interface Comment {
  commentId: number;
  taskId: number;
  userId: number;
  userEmail: string;
  content: string;
  createdAt: string;
}

export interface Department {
  departmentId: number;
  name: string;
  description: string | null;
}

export interface ProjectMember {
  userId: number;
  companyEmail: string;
  joinedAt: string;
}

export interface GlobalSearchResponse {
  projects: Project[];
  users: User[];
  documents: Document[];
}
