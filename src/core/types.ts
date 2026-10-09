export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal' | 'passed';

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Compile Error'
  | 'Runtime Error'
  | 'Judging'
  | 'Pending'
  | 'Unknown';

export interface Course {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  courseId?: string;
  courseName: string;
  title: string;
  deadline: string;
  deadlineTimestamp: number;
  remainingHours: number;
  remainingText: string;
  status: 'pending' | 'submitted' | 'graded';
  urgency: UrgencyLevel;
  url: string;
}

export interface TestCase {
  index: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemDetail {
  id: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
  testCases: TestCase[];
  currentCode?: string;
}

export interface SubmissionResult {
  id: string;
  problemId: string;
  problemTitle: string;
  status: SubmissionStatus;
  submitTime: string;
}

export interface PushConfig {
  pushplusToken?: string;
  barkUrl?: string;
  smsWebhookUrl?: string;
  smsPhone?: string;
  customWebhookUrl?: string;
  hoursThreshold?: number;
}

export interface PlatformConfig {
  baseUrl?: string;
  sessionCookie?: string;
}

export interface HttpClient {
  get(url: string, headers?: Record<string, string>): Promise<string>;
  post(url: string, data?: unknown, headers?: Record<string, string>): Promise<string>;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
