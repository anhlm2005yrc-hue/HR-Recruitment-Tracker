import React, { useState } from "react";
import { Application, Feedback, Job } from "../../types";
import { Slicon } from "../Slicon";

interface FeedbackScreenProps {
  jobs: Job[];
  applications: Application[];
  feedbacksMap: Record<string, Feedback[]>; // applicationId -> Feedbacks Array
  selectedAppId: string;
  onSelectAppId: (appId: string) => void;
  onAddFeedbackClick: (appId: string, candName: string) => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  jobs,
  applications,
  feedbacksMap,
  selectedAppId,
  onSelectAppId,
  onAddFeedbackClick,
}) => {
  // Cascading top-down levels state (R5.10 / R5 F5 flow)
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");

  const [recFilter, setRecFilter] = useState("all");
  const [interviewerFilter, setInterviewerFilter] = useState("all");

  // Reset cascading chain completely with Clear button (R5.10)
  const handleClearAll = () => {
    setSelectedDept("");
    setSelectedJobId("");
    setRecFilter("all");
    setInterviewerFilter("all");
    onSelectAppId("");
  };

  // Get distinct departments from existing jobs
  const distinctDepartments = Array.from(
    new Set(jobs.map((job) => job.department).filter(Boolean))
  ).sort();

  // Enforce Top-Down Cascading: filter jobs belonging strictly to chosen department
  const filteredJobsByDept = selectedDept
    ? jobs.filter((job) => job.department === selectedDept)
    : [];

  // Find Applications linked under the selected Job
  const linkedApplications = selectedJobId
    ? applications.filter((app) => app.jobId === selectedJobId)
    : [];

  // Load and consolidate feedback collections across all selected job application records
  const consolidatedFeedbacks: (Feedback & {
    candidateName: string;
    applicationId: string;
    stage: string;
  })[] = [];

  linkedApplications.forEach((app) => {
    const fbs = feedbacksMap[app.applicationId] || [];
    fbs.forEach((fb) => {
      consolidatedFeedbacks.push({
        ...fb,
        candidateName: app.candidateName,
        applicationId: app.applicationId,
        stage: app.stage,
      });
    });
  });

  // Sort consolidated feedback cards in chronological order (newest first)
  const sortedConsolidatedFeedbacks = [...consolidatedFeedbacks].sort((a, b) => {
    const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate distinct reviewer interviewers list
  const distinctInterviewers = Array.from(
    new Set(sortedConsolidatedFeedbacks.map((fb) => fb.interviewer).filter(Boolean))
  ).sort();

  // Apply filters to sorted feedbacks
  const filteredFeedbacks = sortedConsolidatedFeedbacks.filter((fb) => {
    const matchesRec = recFilter === "all" || fb.recommendation === recFilter;
    const matchesInt = interviewerFilter === "all" || fb.interviewer === interviewerFilter;
    return matchesRec && matchesInt;
  });

  // Calculate Overall average score across all submissions for the selected scope
  const overallAvgScore =
    sortedConsolidatedFeedbacks.length > 0
      ? sortedConsolidatedFeedbacks.reduce((sum, fb) => {
          const itemAvg = (fb.technicalScore + fb.communicationScore + fb.cultureFitScore) / 3;
          return sum + itemAvg;
        }, 0) / sortedConsolidatedFeedbacks.length
      : 0;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "Strong Hire":
        return "bg-emerald-50 text-emerald-850 border-emerald-300";
      case "Hire":
        return "bg-green-50 text-green-800 border-green-250";
      case "Hold":
        return "bg-amber-50 text-amber-800 border-amber-250";
      default:
        return "bg-red-50 text-red-800 border-red-250";
    }
  };

  const isSelectionMade = !!selectedDept && !!selectedJobId;

  return (
    <div className="space-y-6">
      {/* 1. Page Header description metadata info */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Consolidated Position Evaluations
          </h4>
          <p className="text-xs text-gray-400 max-w-lg">
            Compare structured interview rounds, evaluate performance ratios, and observe aggregated scoring feedback across active business hires.
          </p>
        </div>

        {/* Clear cascading filters button (R5.10) */}
        {isSelectionMade && (
          <button
            onClick={handleClearAll}
            className="self-start md:self-auto h-10 px-4 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
          >
            <Slicon name="x" size={14} />
            Reset Sourced Filters
          </button>
        )}
      </div>

      {/* 2. Structured Cascading Hierarchical Filtering Controls Panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150/80 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Department selector element (Mandatory) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            1. Select Division Department *
          </label>
          <select
            className="w-full h-11 px-4 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm text-gray-800 cursor-pointer"
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setSelectedJobId("");
              setRecFilter("all");
              setInterviewerFilter("all");
            }}
          >
            <option value="">-- Choose Division Department --</option>
            {distinctDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} Division
              </option>
            ))}
          </select>
        </div>

        {/* Job selector element (Disabled until Department is selected, filtered by the chosen department, Mandatory) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
            2. Choose Active Opening *
          </label>
          <select
            disabled={!selectedDept}
            className="w-full h-11 px-4 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setRecFilter("all");
              setInterviewerFilter("all");
            }}
          >
            <option value="">
              {!selectedDept ? "Select a department first..." : "-- Choose Job Position --"}
            </option>
            {filteredJobsByDept.map((job) => (
              <option key={job.jobId} value={job.jobId}>
                {job.title} ({job.jobId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Render content conditional on strict selection */}
      {!isSelectionMade ? (
        // R5 Step 1 empty state pre-selection label (Mandatory string match)
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100/80 text-center min-h-[380px] space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#2D6A4F] flex items-center justify-center">
            <Slicon name="settings" size={32} />
          </div>
          <div className="max-w-md space-y-1.5">
            <strong className="text-gray-800 font-bold block text-base">
              Awaiting Selection
            </strong>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Please select a Department and a Job above to view or add feedback.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key application metrics stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Position scope summary card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  DIVISION SCOPE
                </span>
                <strong className="text-sm font-bold text-gray-900 block leading-tight">
                  {jobs.find((j) => j.jobId === selectedJobId)?.title}
                </strong>
                <span className="text-xs text-[#2D6A4F] font-semibold block mt-1">
                  Department: {selectedDept}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs mt-4">
                <span className="text-gray-400 font-medium font-mono">ID: {selectedJobId}</span>
                <span className="px-2.5 py-0.5 bg-[#D8F3DC] text-[#2D6A4F] rounded-full font-bold uppercase text-[9px] tracking-wider border border-green-200">
                  {jobs.find((j) => j.jobId === selectedJobId)?.status || "Active"}
                </span>
              </div>
            </div>

            {/* Evaluations count & average score card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  TOTAL ROUND ASSESSMENTS
                </span>
                <strong className="text-3xl font-black text-gray-900 block">
                  {sortedConsolidatedFeedbacks.length}
                </strong>
                <span className="text-[11px] text-gray-400 font-medium">
                  Across linked candidates
                </span>
              </div>

              {sortedConsolidatedFeedbacks.length > 0 && (
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-emerald-50 text-[#2D6A4F] rounded-full border border-emerald-100 font-semibold gap-0.5">
                  <span className="text-lg font-black font-mono">
                    {overallAvgScore.toFixed(1)}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-800">
                    AVG SCORE
                  </span>
                </div>
              )}
            </div>

            {/* Candidate selection panel */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-[#2D6A4F] uppercase tracking-widest mb-1">
                  EVALUATION REVIEWS
                </span>
                <p className="text-[11px] text-gray-550 leading-relaxed font-medium">
                  Review submitted scores, or proceed to log an assessment for candidates currently undergoing interviews.
                </p>
              </div>

              {/* Linked application selector to easily pick and view details or add */}
              <div className="pt-2 border-t border-gray-50 flex flex-col gap-2 mt-3">
                <select
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-xs font-semibold text-gray-700 cursor-pointer"
                  value={selectedAppId}
                  onChange={(e) => onSelectAppId(e.target.value)}
                >
                  <option value="">-- Apply On-Screen Quick Link --</option>
                  {linkedApplications.map((app) => (
                    <option key={app.applicationId} value={app.applicationId}>
                      {app.candidateName} [Stage: {app.stage}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sourcing Candidate Quick Sub-list Block */}
          {linkedApplications.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm space-y-3">
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">
                Hiring Position Candidacy Applications ({linkedApplications.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {linkedApplications.map((app) => {
                  const isInterviewStage = app.stage === "Interview";
                  return (
                    <div
                      key={app.applicationId}
                      className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-150 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 truncate flex-grow">
                        <strong className="text-xs font-bold text-gray-800 truncate block">
                          {app.candidateName}
                        </strong>
                        <span className="text-[9px] text-gray-400 font-mono font-medium block">
                          App: {app.applicationId} · {app.stage}
                        </span>
                      </div>
                      {isInterviewStage ? (
                        <button
                          onClick={() => onAddFeedbackClick(app.applicationId, app.candidateName)}
                          className="shrink-0 h-8 px-2.5 rounded-lg bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Slicon name="plus" size={12} />
                          Add Eval
                        </button>
                      ) : (
                        <span className="shrink-0 text-[9px] bg-amber-50 text-amber-850 px-2 py-1 rounded-md uppercase font-bold tracking-wide border border-amber-200/50">
                          Locked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtering tools for reviews summary */}
          {sortedConsolidatedFeedbacks.length > 0 && (
            <div className="bg-[#F0FAF4]/40 p-4 rounded-2xl border border-[#D8F3DC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Filter recommendation options */}
                <div className="min-w-[150px]">
                  <select
                    className="w-full h-10 px-3 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-xs font-semibold"
                    value={recFilter}
                    onChange={(e) => setRecFilter(e.target.value)}
                  >
                    <option value="all">All Recommendations</option>
                    <option value="Strong Hire">Strong Hire</option>
                    <option value="Hire">Hire</option>
                    <option value="Hold">Hold</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>

                {/* Filter distinct interviewers */}
                <div className="min-w-[150px]">
                  <select
                    className="w-full h-10 px-3 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-xs font-semibold"
                    value={interviewerFilter}
                    onChange={(e) => setInterviewerFilter(e.target.value)}
                  >
                    <option value="all">All Interviewers</option>
                    {distinctInterviewers.map((int) => (
                      <option key={int} value={int}>
                        {int}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="text-xs text-gray-400 font-bold font-mono">
                Showing {filteredFeedbacks.length} of {sortedConsolidatedFeedbacks.length} reports
              </span>
            </div>
          )}

          {/* 4. Feedback Cards Listing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sortedConsolidatedFeedbacks.length === 0 ? (
              // Empty state when selection is made but no feedback exists
              <div className="p-16 text-center text-gray-400 max-w-lg mx-auto md:col-span-2 border border-gray-150 bg-white rounded-2xl shadow-sm w-full space-y-4">
                <Slicon name="inbox" size={44} className="text-gray-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-extrabold text-gray-700 text-sm">
                    No evaluations submitted yet
                  </p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Please click the "Add Eval" buttons list above to log interview assessments, score technical capacities, and record culture alignment notes.
                  </p>
                </div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="p-12 text-center text-gray-400 max-w-md mx-auto md:col-span-2 w-full space-y-2">
                <p className="font-bold text-gray-750 text-sm">No evaluations match selected traits</p>
                <p className="text-xs text-gray-400">
                  Try clearing recommendation or reviewer filter traits above.
                </p>
              </div>
            ) : (
              filteredFeedbacks.map((fb) => {
                const fbAvg = (fb.technicalScore + fb.communicationScore + fb.cultureFitScore) / 3;
                return (
                  <div
                    key={fb.feedbackId}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150/80 flex flex-col justify-between hover:shadow transition-all relative overflow-hidden"
                  >
                    {/* Top interviewer details card info */}
                    <div>
                      <div className="flex items-start justify-between border-b border-gray-50 pb-3 mb-4 gap-2">
                        <div>
                          <strong className="block text-sm font-bold text-gray-900 leading-snug">
                            {fb.interviewer}
                          </strong>
                          <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wide block mt-1">
                            Applicant: {fb.candidateName}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium font-mono block mt-0.5">
                            ID: {fb.feedbackId} · Logged: {new Date(fb.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-bold text-[9px] uppercase shadow-sm border ${getRecommendationColor(
                            fb.recommendation
                          )}`}
                        >
                          {fb.recommendation}
                        </span>
                      </div>

                      {/* Score values details */}
                      <div className="space-y-3">
                        {/* Technical */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                            <span>Technical Competence</span>
                            <span>{fb.technicalScore} / 5</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(fb.technicalScore / 5) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Comm */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                            <span>Communication Skills</span>
                            <span>{fb.communicationScore} / 5</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${(fb.communicationScore / 5) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Culture */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                            <span>Culture & Values Alignment</span>
                            <span>{fb.cultureFitScore} / 5</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(fb.cultureFitScore / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review comments */}
                    <div className="mt-4 pt-3 border-t border-gray-50 flex-grow">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Notes & Comments
                      </span>
                      <p className="text-xs text-gray-600 leading-relaxed italic whitespace-pre-wrap">
                        {fb.comments ? `"${fb.comments}"` : "No remarks documented."}
                      </p>
                    </div>

                    {/* Bottom average evaluation metric */}
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">Average Scoring:</span>
                      <span className="text-[#2D6A4F] font-black font-mono">
                        {fbAvg.toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
