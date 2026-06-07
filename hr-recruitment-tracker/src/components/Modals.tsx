import React, { useState, useEffect } from "react";
import { ModalBase } from "./ModalBase";
import { Slicon } from "./Slicon";
import { Job, Candidate, Application, Feedback } from "../types";
import {
  validateEmail,
  validateVietnamesePhone,
  generateJobId,
  generateCandidateId,
  calculateRecommendation,
} from "../utils";

// ==========================================
// 1. CONFIRMATION DIALOG MODAL
// ==========================================
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDestructive = false,
}) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDestructive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-[#2D6A4F]"
          }`}
        >
          <Slicon name={isDestructive ? "warning" : "check-circle"} size={24} />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 w-full pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-[#2D6A4F] hover:bg-[#1A3A2E] focus:ring-[#2D6A4F]"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

// ==========================================
// 2. CREATE / EDIT JOB MODAL
// ==========================================
interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
  existingJobs: Job[];
  editingJob?: Job | null;
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingJobs,
  editingJob,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    department: "Engineering",
    location: "Onsite" as "Remote" | "Onsite",
    employmentType: "Full-time",
    headcount: 1,
    requiredSkills: "",
    description: "",
    deadline: "",
    status: "Open" as "Open" | "Closed",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title,
        department: editingJob.department,
        location: editingJob.location,
        employmentType: editingJob.employmentType,
        headcount: editingJob.headcount,
        requiredSkills: Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills.join(", ") : "",
        description: editingJob.description,
        deadline: editingJob.deadline,
        status: editingJob.status,
      });
      setErrors({});
    } else {
      // Default reset
      setFormData({
        title: "",
        department: "Engineering",
        location: "Onsite",
        employmentType: "Full-time",
        headcount: 1,
        requiredSkills: "",
        description: "",
        deadline: "",
        status: "Open",
      });
      setErrors({});
    }
  }, [editingJob, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Job Title is required.";
    if (!formData.department.trim()) newErrors.department = "Department is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.deadline) {
      newErrors.deadline = "Deadline date is required.";
    } else if (!editingJob) {
      // R2.2: New jobs must have future deadline
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        newErrors.deadline = "Deadline must be a future date.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const skillsArray = formData.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const isEdit = !!(editingJob && editingJob.jobId);
    const generatedId = isEdit
      ? editingJob!.jobId
      : generateJobId(formData.department, existingJobs);

    const jobPayload: Job = {
      jobId: generatedId,
      title: formData.title,
      department: formData.department,
      location: formData.location,
      employmentType: formData.employmentType,
      headcount: Number(formData.headcount) || 1,
      hired_count: isEdit ? editingJob!.hired_count : 0,
      requiredSkills: skillsArray,
      description: formData.description,
      deadline: formData.deadline,
      status: formData.status,
      createdDate: isEdit && editingJob!.createdDate ? editingJob!.createdDate : new Date().toISOString(),
    };

    onSave(jobPayload);
    onClose();
  };

  const isActuallyEdit = !!(editingJob && editingJob.jobId);

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={isActuallyEdit ? `Edit Job Opening (${editingJob!.jobId})` : "Create New Job Opening"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Job Title *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="e.g. Senior Software Engineer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Dept & Location Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Department *
            </label>
            <select
              disabled={!!editingJob}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm disabled:bg-gray-100 disabled:text-gray-500"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="Engineering">Engineering (ENG)</option>
              <option value="Marketing">Marketing (MKT)</option>
              <option value="Human Resources">Human Resources (HR)</option>
              <option value="Product">Product (PRD)</option>
              <option value="Finance">Finance (FIN)</option>
              <option value="Design">Design (DSN)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Location *
            </label>
            <select
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as "Remote" | "Onsite" })}
            >
              <option value="Onsite">Onsite</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Type & Headcount Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Employment Type
            </label>
            <select
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Headcount Target
            </label>
            <input
              type="number"
              min={1}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
              value={formData.headcount}
              onChange={(e) => setFormData({ ...formData, headcount: Number(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Required Skills (comma-separated)
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="React, TypeScript, Node.js"
            value={formData.requiredSkills}
            onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Job Description *
          </label>
          <textarea
            rows={4}
            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm leading-relaxed scrollbar-thin"
            placeholder="Write role outline, responsibilities, guidelines..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Deadline & Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Application Deadline *
            </label>
            <input
              type="date"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Status Sourcing
            </label>
            <select
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "Open" | "Closed" })}
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="border-t border-gray-100 pt-5 mt-5 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Discard
          </button>
          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-sm transition-all min-h-[44px] flex items-center gap-2"
          >
            <Slicon name="save" size={16} />
            Save Job
          </button>
        </div>
      </form>
    </ModalBase>
  );
};

// ==========================================
// 3. CREATE / EDIT CANDIDATE MODAL
// ==========================================
interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  existingCandidates: Candidate[];
  editingCandidate?: Candidate | null;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCandidates,
  editingCandidate,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingCandidate) {
      setFormData({
        fullName: editingCandidate.fullName,
        email: editingCandidate.email,
        phone: editingCandidate.phone,
      });
      setErrors({});
    } else {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
      });
      setErrors({});
    }
  }, [editingCandidate, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email formatting (local@domain.tld).";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!validateVietnamesePhone(formData.phone)) {
      newErrors.phone = "Must be a valid Vietnamese mobile number (e.g., 03, 05, 07, 08, 09 followed by 8 digits).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const generatedId = editingCandidate
      ? editingCandidate.candidateId
      : generateCandidateId(existingCandidates);

    const candidatePayload: Candidate = {
      candidateId: generatedId,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      hasHiredApplication: editingCandidate ? editingCandidate.hasHiredApplication : false,
      createdDate: editingCandidate ? editingCandidate.createdDate : new Date().toISOString(),
    };

    onSave(candidatePayload);
    onClose();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingCandidate ? `Edit Candidate Profile (${editingCandidate.candidateId})` : "Add Master Candidate Profile"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="e.g. Nguyen Van A"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email Address *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="local@domain.tld"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Vietnamese Mobile Phone *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="e.g. 0912345678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-5 mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Discard
          </button>
          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-sm transition-all min-h-[44px] flex items-center gap-2"
          >
            <Slicon name="user-plus" size={16} />
            Save Profile
          </button>
        </div>
      </form>
    </ModalBase>
  );
};

// ==========================================
// 4. LINK CANDIDATE TO JOB (CREATE APPLICATION) MODAL
// ==========================================
interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  jobs: Job[];
  applications: Application[];
  onApply: (data: { jobId: string; jobTitle: string; cvLink: string }) => void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  jobs,
  applications,
  onApply,
}) => {
  const [jobId, setJobId] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [errorHeader, setErrorHeader] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Pick the first available open job
    const openJobs = jobs.filter((j) => j.status === "Open");
    if (openJobs.length > 0) {
      setJobId(openJobs[0].jobId);
    } else {
      setJobId("");
    }
    setCvLink("");
    setErrorHeader("");
    setErrors({});
  }, [isOpen, jobs]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!jobId) newErrors.jobId = "Please select a target position.";
    if (!cvLink.trim()) {
      newErrors.cvLink = "CV Document Link is required.";
    } else {
      try {
        new URL(cvLink.trim());
      } catch {
        newErrors.cvLink = "Must enter a valid absolute web URL link (e.g. https://...)";
      }
    }

    // R3.2 Multi-Application Logic & ongoing active check
    if (jobId) {
      const alreadyHasMatched = applications.find(
        (app) => app.candidateId === candidateId && app.jobId === jobId
      );
      if (alreadyHasMatched) {
        if (alreadyHasMatched.stage !== "Rejected" && alreadyHasMatched.stage !== "Hired") {
          setErrorHeader("This candidate has already applied for this position with an ongoing application.");
          return false;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHeader("");
    if (!validate()) return;

    const targetJob = jobs.find((j) => j.jobId === jobId);
    if (!targetJob) return;

    onApply({
      jobId,
      jobTitle: targetJob.title,
      cvLink: cvLink.trim(),
    });
    onClose();
  };

  const openJobs = jobs.filter((j) => j.status === "Open");

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={`Apply ${candidateName} to Job`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning header */}
        {errorHeader && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
            <Slicon name="warning" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p>{errorHeader}</p>
          </div>
        )}

        {/* Choose Position */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Opening Position & Department *
          </label>
          <select
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            {openJobs.length === 0 && <option value="">No Active Job Openings Available</option>}
            {openJobs.map((j) => (
              <option key={j.jobId} value={j.jobId}>
                {j.title} · {j.department} ({j.jobId})
              </option>
            ))}
          </select>
          {errors.jobId && <p className="text-red-500 text-xs mt-1">{errors.jobId}</p>}
        </div>

        {/* CV Attach link */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            CV link / Portfolio Url *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="e.g. https://drive.google.com/file/d/cv_file..."
            value={cvLink}
            onChange={(e) => setCvLink(e.target.value)}
          />
          {errors.cvLink && <p className="text-red-500 text-xs mt-1">{errors.cvLink}</p>}
        </div>

        {/* Description warning */}
        <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-gray-500 text-xs leading-relaxed">
          The candidate will automatically start in the <span className="font-semibold text-gray-700">Applied</span> stage upon creation.
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#F3F4F6] pt-5 mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={openJobs.length === 0}
            className="py-2.5 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-sm transition-all min-h-[44px] flex items-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Slicon name="link" size={16} />
            Link Application
          </button>
        </div>
      </form>
    </ModalBase>
  );
};

// ==========================================
// 5. INTERVIEW FEEDBACK MODAL
// ==========================================
interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  onSaveFeedback: (feedback: Feedback) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  onSaveFeedback,
}) => {
  const [formData, setFormData] = useState({
    interviewer: "",
    technicalScore: 3,
    communicationScore: 3,
    cultureFitScore: 3,
    comments: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      interviewer: "",
      technicalScore: 3,
      communicationScore: 3,
      cultureFitScore: 3,
      comments: "",
    });
    setErrors({});
  }, [isOpen]);

  const currentRecommendation = calculateRecommendation({
    technical: formData.technicalScore,
    communication: formData.communicationScore,
    cultureFit: formData.cultureFitScore,
  });

  const getRecommendationColorClasses = (rec: string) => {
    switch (rec) {
      case "Strong Hire":
        return "bg-emerald-100 text-emerald-900 border border-emerald-300";
      case "Hire":
        return "bg-green-100 text-green-900 border border-green-200";
      case "Hold":
        return "bg-amber-100 text-amber-900 border border-amber-200";
      default:
        return "bg-red-100 text-red-955 border border-red-200";
    }
  };

  const handleScoreChange = (field: string, val: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.interviewer.trim()) {
      newErrors.interviewer = "Interviewer name is required (anonymous evaluations are disabled).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const feedbackPayload: Feedback = {
      feedbackId: "FDB" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      interviewer: formData.interviewer,
      technicalScore: formData.technicalScore,
      communicationScore: formData.communicationScore,
      cultureFitScore: formData.cultureFitScore,
      comments: formData.comments,
      recommendation: currentRecommendation,
      createdDate: new Date().toISOString(),
    };

    onSaveFeedback(feedbackPayload);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={`Submit Interview Evaluation for ${candidateName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Interviewer */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Interviewer *
          </label>
          <input
            type="text"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
            placeholder="Interviewer Name"
            value={formData.interviewer}
            onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
          />
          {errors.interviewer && <p className="text-red-500 text-xs mt-1">{errors.interviewer}</p>}
        </div>

        {/* Scores Grid */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 border-b pb-2 mb-2">Evaluations Scale (1 to 5)</h4>
          
          {/* Tech */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">Technical Skillset</span>
              <span className="font-bold text-[#2D6A4F]">{formData.technicalScore} / 5</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleScoreChange("technicalScore", num)}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold border transition-all ${
                    formData.technicalScore === num
                      ? "bg-[#2D6A4F] text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Comm */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">Communication Skills</span>
              <span className="font-bold text-[#2D6A4F]">{formData.communicationScore} / 5</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleScoreChange("communicationScore", num)}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold border transition-all ${
                    formData.communicationScore === num
                      ? "bg-[#2D6A4F] text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Culture */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700">Culture & Values Fit</span>
              <span className="font-bold text-[#2D6A4F]">{formData.cultureFitScore} / 5</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleScoreChange("cultureFitScore", num)}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold border transition-all ${
                    formData.cultureFitScore === num
                      ? "bg-[#2D6A4F] text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generated recommendation badge */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            System Outcome Preview (R5.8)
          </label>
          <div className={`p-3 rounded-xl border flex items-center justify-between text-sm ${getRecommendationColorClasses(currentRecommendation)}`}>
            <span className="font-medium text-xs uppercase tracking-wide">Calculated Recommendation:</span>
            <span className="font-bold px-3 py-1 bg-white/70 backdrop-blur-sm rounded-lg text-xs uppercase shadow-sm">
              {currentRecommendation}
            </span>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Interviewer Comments
          </label>
          <textarea
            rows={3}
            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm leading-relaxed"
            placeholder="Log technical bullet points, interview details, specific examples..."
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          />
        </div>

        {/* Action button panel */}
        <div className="border-t border-[#F3F4F6] pt-5 mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-sm transition-all min-h-[44px] flex items-center gap-2 animate-pulse-once"
          >
            <Slicon name="save" size={16} />
            Submit Evaluation
          </button>
        </div>
      </form>
    </ModalBase>
  );
};

// ==========================================
// 6. STAGE TRANSITION WARNING MODAL
// ==========================================
interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  currentStage: string;
  nextStage: string;
  onConfirm: () => void;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  currentStage,
  nextStage,
  onConfirm,
}) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pipeline Stage Transition">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <Slicon name="warning" size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-gray-800 text-sm font-medium leading-relaxed">
            Move <strong className="text-[#2D6A4F]">{candidateName}</strong> from <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded text-xs uppercase tracking-wider">{currentStage}</span> to <span className="font-semibold px-2 py-0.5 bg-[#D8F3DC] text-[#2D6A4F] rounded text-xs uppercase tracking-wider">{nextStage}</span>?
          </p>
          <p className="text-gray-500 text-xs">
            Once moved to the next stage, this application cannot return to the previous stage.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full pt-4 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1A3A2E] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] min-h-[44px]"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

// ==========================================
// 7. BATCH EMAIL DISPATCHER MODAL
// ==========================================
interface BatchEmailDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  applications: Application[];
  onTriggerSend: (selectedAppIds: string[], autoProgressAppIds: string[]) => Promise<void>;
}

export const BatchEmailDispatcherModal: React.FC<BatchEmailDispatcherModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  applications,
  onTriggerSend,
}) => {
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"template" | "recipients">("recipients");
  const [isProcessing, setIsProcessing] = useState(false);

  // Eligible to receive emails: applications under this closed jobId that are "Rejected"
  // Plus we include any pending/ongoing non-terminal applications because R7.6 blocks closed jobs
  const affectedApplications = applications.filter(
    (app) => app.jobId === jobId && (app.stage === "Rejected" || (app.stage !== "Hired" && app.stage !== "Rejected"))
  );

  useEffect(() => {
    // Select all eligible recipients by default on open EXCEPT those already sent
    const defaultIds = affectedApplications
      .filter((app) => !app.batchEmailLogs?.rejectedNotificationSent)
      .map((app) => app.applicationId);
    setSelectedRecipientIds(defaultIds);
    setActiveTab("recipients");
  }, [isOpen, applications, jobId]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const unsentIds = affectedApplications
      .filter((app) => !app.batchEmailLogs?.rejectedNotificationSent)
      .map((app) => app.applicationId);
    setSelectedRecipientIds(unsentIds);
  };

  const deselectAll = () => {
    setSelectedRecipientIds([]);
  };

  const handleSend = async () => {
    if (selectedRecipientIds.length === 0) return;
    setIsProcessing(true);
    try {
      // Find all selected apps that are currently in a non-terminal intermediate stage (which must auto-transition to Rejected)
      const checkedIntermediateApps = affectedApplications.filter(
        (app) => selectedRecipientIds.includes(app.applicationId) && app.stage !== "Rejected"
      ).map(app => app.applicationId);

      await onTriggerSend(selectedRecipientIds, checkedIntermediateApps);
      onClose();
    } catch (err) {
      console.error("Failed sending emails:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={`Candidate Rejection Batch Email Dispatcher (${jobId})`}>
      <div className="flex flex-col h-full space-y-4">
        {/* Top Header info tabs for responsive views */}
        <div className="flex items-center border-b border-gray-100 pb-2">
          <button
            onClick={() => setActiveTab("recipients")}
            className={`flex-1 text-center py-2 text-xs font-semibold tracking-wide uppercase transition-all border-b-2 ${
              activeTab === "recipients"
                ? "border-[#52B788] text-[#2D6A4F] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Recipient List ({affectedApplications.length})
          </button>
          <button
            onClick={() => setActiveTab("template")}
            className={`flex-1 text-center py-2 text-xs font-semibold tracking-wide uppercase transition-all border-b-2 ${
              activeTab === "template"
                ? "border-[#52B788] text-[#2D6A4F] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Template Preview
          </button>
        </div>

        {/* Tab 1: RECIPIENTS CHECKLIST */}
        {activeTab === "recipients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Selected {selectedRecipientIds.length} of {affectedApplications.length} candidates
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[#2D6A4F] hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-gray-300 text-xs">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Recipient table lists */}
            <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-thin">
              {affectedApplications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs text-muted flex flex-col items-center justify-center">
                  <Slicon name="inbox" size={32} className="text-gray-300 mb-2" />
                  No candidates eligible for batch notifications in this cycle.
                </div>
              ) : (
                affectedApplications.map((app) => {
                  const alreadySent = !!app.batchEmailLogs?.rejectedNotificationSent;
                  const isChecked = selectedRecipientIds.includes(app.applicationId);
                  const isIntermediate = app.stage !== "Rejected";

                  return (
                    <div
                      key={app.applicationId}
                      className={`flex items-center justify-between p-3.5 transition-colors ${
                        alreadySent ? "bg-gray-50 opacity-60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          disabled={alreadySent}
                          checked={isChecked && !alreadySent}
                          onChange={() => toggleRecipient(app.applicationId)}
                          className="w-4 h-4 rounded text-[#2D6A4F] focus:ring-[#52B788] border-gray-300 mt-1 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {app.candidateName}
                            </span>
                            {isIntermediate && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-medium border border-amber-150 uppercase tracking-tighter">
                                Auto-Reject
                              </span>
                            )}
                            {alreadySent && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-medium border uppercase tracking-tighter">
                                Already Emailed
                              </span>
                            )}
                          </div>
                          <span className="block text-xs font-mono text-gray-400">
                            {app.applicationId} · Stage: {app.stage}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <p className="text-[11px] text-gray-500 leading-relaxed italic border-l-2 pl-2 border-emerald-300">
              Note: Unfinished candidates selected in this dispatcher will automatically transition to the <strong>Rejected</strong> terminal stage inline with tracking policies.
            </p>
          </div>
        )}

        {/* Tab 2: STATIC TEMPLATE PREVIEW */}
        {activeTab === "template" && (
          <div className="space-y-3 bg-[#F0FAF4] p-4 rounded-2xl border border-[#D8F3DC]">
            <div className="text-xs text-gray-600 border-b border-white-50/50 pb-2 space-y-1">
              <p><strong>From:</strong> Recruiter Team &lt;hr.talent-cycle@company.com&gt;</p>
              <p><strong>Subject:</strong> Your Application for the {jobTitle} Position</p>
            </div>
            <div className="text-xs text-gray-700 font-serif leading-relaxed h-[240px] overflow-y-auto whitespace-pre-wrap pr-1 scrollbar-thin">
              {`Dear [Candidate_Name],

Thank you for your interest in the **${jobTitle}** position and for the time and effort you invested throughout our recruitment process. We appreciate the opportunity to have learned more about your background and experience.

After careful consideration, we have concluded our hiring cycle for this role and will not be moving forward with your application at this stage. We want to be transparent: this was a highly competitive process, and this outcome is not necessarily a reflection of your capabilities or potential.

Your profile will be retained in our talent pool, and we will reach out should a suitable opportunity arise in the future. We genuinely encourage you to continue pursuing roles where your skills can be fully recognized and rewarded.

We wish you every success in your career ahead.

Sincerely,
The HR Team`}
            </div>
          </div>
        )}

        {/* Action dispatches buttons */}
        <div className="border-t border-[#F3F4F6] pt-5 mt-5 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all min-h-[44px]   w-1/2 md:w-auto"
          >
            Skip & Close
          </button>
          <button
            type="button"
            disabled={selectedRecipientIds.length === 0 || isProcessing}
            onClick={handleSend}
            className="py-2.5 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] min-h-[44px] flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed   w-1/2 md:w-auto"
          >
            {isProcessing ? (
              <>
                <Slicon name="loader" size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Slicon name="mail" size={16} />
                Send Batch Email ({selectedRecipientIds.length})
              </>
            )}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
