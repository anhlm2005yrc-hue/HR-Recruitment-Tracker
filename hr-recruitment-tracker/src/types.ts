/**
 * Types and interfaces for the HR Recruitment Tracker
 */

export interface Job {
  jobId: string;
  title: string;
  department: string;
  location: "Remote" | "Onsite";
  employmentType: string;
  headcount: number;
  hired_count: number;
  requiredSkills: string[];
  description: string;
  deadline: string;
  status: "Open" | "Closed";
  createdDate: string;
}

export interface Candidate {
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  hasHiredApplication: boolean;
  createdDate: string;
}

export interface BatchEmailLogs {
  offerNotificationSent?: boolean;
  offerNotificationSentAt?: string | null;
  rejectedNotificationSent?: boolean;
  rejectedNotificationSentAt?: string | null;
}

export interface Application {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  cvLink: string;
  stage: "Applied" | "Screening" | "Interview" | "Assessment" | "Offer" | "Hired" | "Rejected";
  applicationDate: string;
  lastActivityDate: string;
  batchEmailLogs?: BatchEmailLogs;
  feedbacks?: { [feedbackId: string]: Feedback }; // Used for nested RTDB mapping
}

export interface Feedback {
  feedbackId: string;
  interviewer: string;
  technicalScore: number; // 1-5
  communicationScore: number; // 1-5
  cultureFitScore: number; // 1-5
  comments?: string;
  recommendation: "Strong Hire" | "Hire" | "Hold" | "Reject";
  createdDate: string;
}
