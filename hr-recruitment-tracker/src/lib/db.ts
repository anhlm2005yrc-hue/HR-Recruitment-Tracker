import { ref, get, set, remove, update } from "firebase/database";
import { database } from "./firebase";
import { Job, Candidate, Application, Feedback } from "../types";

// Helper to convert Firebase object collections to arrays
function toArray<T>(obj: Record<string, T> | null): T[] {
  if (!obj) return [];
  return Object.values(obj);
}

// Utility helpers for fetching SDK data securely
async function fetchFromDb<T>(path: string): Promise<T | null> {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val() as T;
    }
    return null;
  } catch (err) {
    console.error(`DB Fetch Error at ${path}:`, err);
    return null;
  }
}

async function writeToDb<T>(path: string, data: T): Promise<boolean> {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
    return true;
  } catch (err) {
    console.error(`DB Write Error at ${path}:`, err);
    return false;
  }
}

async function deleteFromDb(path: string): Promise<boolean> {
  try {
    const dbRef = ref(database, path);
    await remove(dbRef);
    return true;
  } catch (err) {
    console.error(`DB Delete Error at ${path}:`, err);
    return false;
  }
}

export async function handleUpdate(path: string, key: string, value: any): Promise<boolean> {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, { [key]: value });
    return true;
  } catch (err) {
    console.log("handleUpdate error:", err);
    return false;
  }
}

// ==========================================
// JOB MANAGEMENT (F2)
// ==========================================
export async function getJobs(): Promise<Job[]> {
  const data = await fetchFromDb<Record<string, Job>>("jobs");
  return toArray(data);
}

export async function saveJob(job: Job): Promise<boolean> {
  // Check if it's an update, and if the title changes, propagate the new title to linked applications
  const existingJob = await fetchFromDb<Job>(`jobs/${job.jobId}`);
  const success = await writeToDb(`jobs/${job.jobId}`, job);

  if (success && existingJob && existingJob.title !== job.title) {
    // R2.11: Propagate updated jobTitle to all applications
    const apps = await getApplications();
    const linkedApps = apps.filter(app => app.jobId === job.jobId);
    for (const app of linkedApps) {
      const updatedApp = { ...app, jobTitle: job.title };
      await writeToDb(`applications/${app.applicationId}`, updatedApp);
    }
  }
  return success;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  // R2.8: Cascade delete job, linked applications, and nested feedback
  const success = await deleteFromDb(`jobs/${jobId}`);
  if (!success) return false;

  const apps = await getApplications();
  const linkedApps = apps.filter(app => app.jobId === jobId);
  for (const app of linkedApps) {
    await deleteApplication(app.applicationId);
  }
  return true;
}

// ==========================================
// CANDIDATE MANAGEMENT (F3)
// ==========================================
export async function getCandidates(): Promise<Candidate[]> {
  const data = await fetchFromDb<Record<string, Candidate>>("candidates");
  return toArray(data);
}

export async function saveCandidate(candidate: Candidate): Promise<boolean> {
  return await writeToDb(`candidates/${candidate.candidateId}`, candidate);
}

export async function deleteCandidate(candidateId: string): Promise<{ success: boolean; error?: string }> {
  // R3.5: Hired Candidate Deletion Protection
  const apps = await getApplications();
  const candidateApps = apps.filter(app => app.candidateId === candidateId);
  
  const hasHired = candidateApps.some(app => app.stage === "Hired");
  if (hasHired) {
    return {
      success: false,
      error: "This candidate has been hired and cannot be deleted to prevent history corruption."
    };
  }

  // Deletion permitted: delete candidate and cascade delete applications
  const success = await deleteFromDb(`candidates/${candidateId}`);
  if (!success) return { success: false, error: "Failed to delete from database" };

  for (const app of candidateApps) {
    await deleteApplication(app.applicationId);
  }

  return { success: true };
}

// ==========================================
// APPLICATION MANAGEMENT (F3 / F4)
// ==========================================
export async function getApplications(): Promise<Application[]> {
  const data = await fetchFromDb<Record<string, Application>>("applications");
  return toArray(data);
}

export async function saveApplication(app: Application): Promise<boolean> {
  // On save application, let's keep candidate's "hasHiredApplication" flag in sync
  const success = await writeToDb(`applications/${app.applicationId}`, app);
  if (success) {
    await updateCandidateHiredState(app.candidateId);
    await updateJobHiredState(app.jobId);
  }
  return success;
}

export async function deleteApplication(applicationId: string): Promise<boolean> {
  // Read application first to know the candidateId and jobId
  const app = await fetchFromDb<Application>(`applications/${applicationId}`);
  if (!app) return false;

  const success = await deleteFromDb(`applications/${applicationId}`);
  if (success) {
    // Update candidate and job states
    await updateCandidateHiredState(app.candidateId);
    await updateJobHiredState(app.jobId);
  }
  return success;
}

// Recalculates and stores candidates' hasHiredApplication boolean in DB
async function updateCandidateHiredState(candidateId: string): Promise<void> {
  const apps = await getApplications();
  const hired = apps.some(app => app.candidateId === candidateId && app.stage === "Hired");
  const candidate = await fetchFromDb<Candidate>(`candidates/${candidateId}`);
  if (candidate && candidate.hasHiredApplication !== hired) {
    await writeToDb(`candidates/${candidateId}`, { ...candidate, hasHiredApplication: hired });
  }
}

// Recalculates and updates specific jobs' hired_count state in DB
async function updateJobHiredState(jobId: string): Promise<void> {
  const apps = await getApplications();
  const hiredCount = apps.filter(app => app.jobId === jobId && app.stage === "Hired").length;
  const job = await fetchFromDb<Job>(`jobs/${jobId}`);
  if (job && job.hired_count !== hiredCount) {
    await writeToDb(`jobs/${jobId}`, { ...job, hired_count: hiredCount });
  }
}

// ==========================================
// FEEDBACK LOGGER (F5)
// ==========================================
export async function getFeedbacks(applicationId: string): Promise<Feedback[]> {
  const data = await fetchFromDb<Record<string, Feedback>>(`applications/${applicationId}/feedbacks`);
  return toArray(data);
}

export async function saveFeedback(applicationId: string, feedback: Feedback): Promise<boolean> {
  // Save specific feedback
  const success = await writeToDb(`applications/${applicationId}/feedbacks/${feedback.feedbackId}`, feedback);
  if (success) {
    // R5: finding application and setting application.lastActivityDate = now()
    const app = await fetchFromDb<Application>(`applications/${applicationId}`);
    if (app) {
      await writeToDb(`applications/${applicationId}`, {
        ...app,
        lastActivityDate: new Date().toISOString()
      });
    }
  }
  return success;
}
