import { Job, Candidate, Feedback } from "./types";

// ==========================================
// VALIDATIONS & REGEX PATTERNS
// ==========================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return emailRegex.test(email);
}

export function validateVietnamesePhone(phone: string): boolean {
  const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
  return phoneRegex.test(phone);
}

// ==========================================
// AUTO-GENERATING JOB ID (R2.4)
// ==========================================
// Returns new ID like ENG26001
export function generateJobId(department: string, existingJobs: Job[]): string {
  const deptCode = department.trim().substring(0, 3).toUpperCase();
  const yearCode = "26"; // 2026 from metadata current year

  // Filter jobs by current department
  const deptJobs = existingJobs.filter(
    (j) => j.jobId.startsWith(deptCode) && j.jobId.substring(3, 5) === yearCode
  );

  let maxSeq = 0;
  for (const dj of deptJobs) {
    const seqStr = dj.jobId.substring(5);
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  }

  const nextSeqNum = maxSeq + 1;
  const sequenceStr = nextSeqNum.toString().padStart(3, "0");
  return `${deptCode}${yearCode}${sequenceStr}`;
}

// ==========================================
// AUTO-GENERATING CANDIDATE ID
// ==========================================
export function generateCandidateId(existingCandidates: Candidate[]): string {
  let maxSeq = 0;
  for (const c of existingCandidates) {
    if (c.candidateId.startsWith("CAN")) {
      const seqStr = c.candidateId.substring(3);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }
  const nextSeqNum = maxSeq + 1;
  const sequenceStr = nextSeqNum.toString().padStart(6, "0");
  return `CAN${sequenceStr}`;
}

// ==========================================
// CALCULATING AUTO-RECOMMENDATIONS (R5.8)
// ==========================================
export function calculateRecommendation(scores: {
  technical: number;
  communication: number;
  cultureFit: number;
}): "Strong Hire" | "Hire" | "Hold" | "Reject" {
  const { technical, communication, cultureFit } = scores;
  const average = (technical + communication + cultureFit) / 3;

  const noScoreBelow4 = technical >= 4 && communication >= 4 && cultureFit >= 4;
  const noScoreBelow3 = technical >= 3 && communication >= 3 && cultureFit >= 3;

  // Strong Hire: Avg >= 4.5, No score below 4
  if (average >= 4.5 && noScoreBelow4) {
    return "Strong Hire";
  }
  // Hire: Avg: 3.5 - 4.4, No score below 3
  if (average >= 3.5 && noScoreBelow3) {
    return "Hire";
  }
  // Hold: Avg: 2.8 - 3.4, Tech >= 3, no score is 1
  if (
    average >= 2.8 &&
    technical >= 3 &&
    technical !== 1 &&
    communication !== 1 &&
    cultureFit !== 1
  ) {
    return "Hold";
  }
  // Reject: Avg < 2.8 or any score <= 2
  return "Reject";
}
