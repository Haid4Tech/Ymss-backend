import { Role } from "./enum";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Student {
  id: number;
  userId: number;
  classId: number;
  parentId?: number;
}

export interface Parent {
  id: number;
  userId: number;
  user: User;
  students: Student[];
}
