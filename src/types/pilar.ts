export interface User {
  id: string;
  name: string;
  email: string;
  role: 'persona1' | 'persona2';
  avatar: string;
  partnerId: string;
}

export interface PilarDelDia {
  id: number;
  emoji: string;
  titulo: string;
  frase: string;
  categoria: 'pilar' | 'mandamiento';
}

export interface HabitQuestion {
  id: string;
  text: string;
  userId: string;
  category: string;
}

export interface HabitAnswer {
  questionId: string;
  answer: boolean;
  date: string;
  userId: string;
}

export interface Letter {
  id: string;
  from: string;
  to: string;
  content: string;
  date: string;
  isPublic: boolean;
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'espiritual' | 'cita' | 'importante';
  createdBy: string;
  shared: boolean;
}

export interface SharedNote {
  id: string;
  pilarId: number;
  content: string;
  date: string;
  userId: string;
}
