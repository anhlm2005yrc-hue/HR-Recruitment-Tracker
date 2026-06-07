import React, { useState } from "react";
import { Candidate, Application, Job, Feedback } from "../../types";
import { Slicon } from "../Slicon";

interface CandidatesScreenProps {
  candidates: Candidate[];
  applications: Application[];
  jobs: Job[];
  feedbacksMap: Record<string, Feedback[]>; // applicationId -> Feedbacks Array
  onAddCandidateClick: () => void;
  onEditCandidateClick: (candidate: Candidate) => void;
  onDeleteCandidateClick: (candidateId: string) => void;
  onApplyToJobClick: (candidateId: string, candidateName: string) => void;
  onNavigateToApplication: (applicationId: string) => void;
}

export const CandidatesScreen: React.FC<CandidatesScreenProps> = ({
  candidates,
  applications,
  jobs,
  feedbacksMap,
  onAddCandidateClick,
  onEditCandidateClick,
  onDeleteCandidateClick,
  onApplyToJobClick,
  onNavigateToApplication,
}) => {
  const [activeTab, setActiveTab] = useState<"candidates" | "applications">("candidates");

  // Candidates Filters
  const [candSearch, setCandSearch] = useState("");
  // Applications Filters
  const [appSearch, setAppSearch] = useState("");
  const [appJobFilter, setAppJobFilter] = useState("all");
  const [appStageFilter, setAppStageFilter] = useState("all");
  const [appRecFilter, setAppRecFilter] = useState("all");

  const [expandedCandRows, setExpandedCandRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleCandidateRow = (id: string) => {
    setExpandedCandRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStageColorDot = (stage: string) => {
    switch (stage) {
      case "Applied":
        return "#3B82F6";
      case "Screening":
        return "#10B981";
      case "Interview":
        return "#F59E0B";
      case "Assessment":
        return "#6366F1";
      case "Offer":
        return "#EC4899";
      case "Hired":
        return "#14B8A6";
      case "Rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const clearCandidateFilters = () => {
    setCandSearch("");
  };

  const clearApplicationFilters = () => {
    setAppSearch("");
    setAppJobFilter("all");
    setAppStageFilter("all");
    setAppRecFilter("all");
    setCurrentPage(1);
  };

  // Filtered Candidates, sorted chronologically descending by createdDate (R3.7)
  const filteredCandidates = candidates
    .filter((cand) => {
      const term = candSearch.trim().toLowerCase();
      if (!term) return true;
      const fullName = (cand?.fullName || "").toLowerCase();
      const email = (cand?.email || "").toLowerCase();
      const phone = (cand?.phone || "").toLowerCase();
      return (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    })
    .sort((a, b) => {
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });

  // Calculate Application level details (like feedback score and recommendation) for filtering
  const getAppFeedbackDetails = (appId: string) => {
    const fbs = feedbacksMap[appId] || [];
    if (fbs.length === 0) return { avgScore: 0, roundedAvg: "NA", count: 0, rec: "Pending" };
    
    const sum = fbs.reduce((acc, f) => acc + (f.technicalScore + f.communicationScore + f.cultureFitScore) / 3, 0);
    const avgScore = sum / fbs.length;

    // Use latest feedback recommendation as current state or compute it
    const rec = fbs[fbs.length - 1].recommendation;
    return {
      avgScore,
      roundedAvg: avgScore.toFixed(1),
      count: fbs.length,
      rec,
    };
  };

  // Filtered Applications List, sorted chronologically descending by applicationDate (R3.7)
  const filteredApplications = applications
    .filter((app) => {
      const term = appSearch.trim().toLowerCase();
      const candidateName = (app?.candidateName || "").toLowerCase();
      const jobTitle = (app?.jobTitle || "").toLowerCase();
      const matchesSearch = term ? candidateName.includes(term) || jobTitle.includes(term) : true;
      const matchesJob = appJobFilter === "all" || app.jobId === appJobFilter;
      const matchesStage = appStageFilter === "all" || app.stage === appStageFilter;

      let matchesRec = true;
      if (appRecFilter !== "all") {
        const details = getAppFeedbackDetails(app.applicationId);
        matchesRec = details.rec === appRecFilter;
      }

      return matchesSearch && matchesJob && matchesStage && matchesRec;
    })
    .sort((a, b) => {
      const dateA = a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
      const dateB = b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
      return dateB - dateA;
    });

  // Pagination for Applications
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Tab Selector Links Header */}
      <div className="border-b border-gray-150 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("candidates")}
          className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-all relative border-b-2 ${
            activeTab === "candidates"
              ? "border-[#52B788] text-[#2D6A4F] font-bold"
              : "border-transparent text-gray-400 hover:text-gray-655"
          }`}
        >
          Master Candidates DB ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-all relative border-b-2 ${
            activeTab === "applications"
              ? "border-[#52B788] text-[#2D6A4F] font-bold"
              : "border-transparent text-gray-400 hover:text-gray-655"
          }`}
        >
          Linked Applications ({applications.length})
        </button>
      </div>

      {/* ==========================================
          TAB 1: CANDIDATES DATABASE VIEW
          ========================================== */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-grow sm:flex-initial sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Slicon name="search" size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-205 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                  value={candSearch}
                  onChange={(e) => setCandSearch(e.target.value)}
                />
              </div>

              {candSearch && (
                <button
                  onClick={clearCandidateFilters}
                  className="px-3 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-500"
                >
                  Clear
                </button>
              )}
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Registered Candidates: {filteredCandidates.length}
            </span>
          </div>

          {/* Master Table listing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm table-auto">
                <thead>
                  <tr className="bg-[#F0FAF4]/60 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 w-10"></th>
                    <th className="py-4 px-6 sticky left-0 bg-white md:bg-transparent z-10 w-[180px]">
                      Candidate Name
                    </th>
                    <th className="py-4 px-6">Email / Phone</th>
                    <th className="py-4 px-6">Active Tracking Pill / Status</th>
                    <th className="py-4 px-6 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400">
                        <div className="max-w-xs mx-auto flex flex-col items-center justify-center text-center">
                          <Slicon name="users" size={44} className="text-gray-300 mb-3" />
                          <p className="font-semibold text-gray-700 text-sm mb-1">
                            No profiles on ledger
                          </p>
                          <p className="text-xs text-gray-400">
                            Create profiles first, then link them to open job openings.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => {
                      const expanded = expandedCandRows.includes(cand.candidateId);
                      
                      // Get all candidate's applications
                      const candApps = applications
                        .filter((app) => app.candidateId === cand.candidateId)
                        .sort((a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime());

                      // Primary App is first (most recently active)
                      const primaryApp = candApps.length > 0 ? candApps[0] : null;
                      const remainingApps = candApps.length > 1 ? candApps.slice(1) : [];

                      return (
                        <React.Fragment key={cand.candidateId}>
                          <tr className={`hover:bg-[#F0FAF4]/10 transition-colors ${expanded ? "bg-[#F0FAF4]/20" : ""}`}>
                            {/* Expand Row chevron trigger */}
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => toggleCandidateRow(cand.candidateId)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 min-h-[36px] min-w-[36px]"
                              >
                                <Slicon name={expanded ? "chevron-down" : "chevron-right"} size={16} />
                              </button>
                            </td>

                            {/* Name pinned left */}
                            <td className="py-4 px-6 font-bold text-gray-900 sticky left-0 bg-white hover:bg-slate-50 md:bg-transparent z-10 shadow-sm md:shadow-none min-w-[180px]">
                              <div>
                                <span>{cand.fullName}</span>
                                <span className="block text-[10px] font-mono font-medium text-gray-400 mt-0.5">
                                  {cand.candidateId}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="text-xs leading-relaxed">
                                <span className="block text-gray-700 font-medium">{cand.email}</span>
                                <span className="block text-gray-400 font-mono">{cand.phone}</span>
                              </div>
                            </td>

                            {/* Active tracking pill details (R3.7 / CD6) */}
                            <td className="py-4 px-6">
                              {primaryApp ? (
                                <div className="flex items-center gap-2">
                                  {/* Pinned pill */}
                                  <button
                                    onClick={() => onNavigateToApplication(primaryApp.applicationId)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full text-xs font-semibold shadow-sm transition-all text-gray-800"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full inline-block"
                                      style={{ backgroundColor: getStageColorDot(primaryApp.stage) }}
                                    />
                                    <span className="truncate max-w-[100px]" title={primaryApp.jobTitle}>
                                      {primaryApp.jobTitle}
                                    </span>
                                    <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-bold uppercase">
                                      {primaryApp.stage}
                                    </span>
                                  </button>

                                  {/* Remaining application stage DOTS */}
                                  {remainingApps.map((app) => (
                                    <span
                                      key={app.applicationId}
                                      onClick={() => onNavigateToApplication(app.applicationId)}
                                      title={`${app.jobTitle} · ${app.stage}`}
                                      className="w-2.5 h-2.5 rounded-full inline-block cursor-pointer border border-white hover:scale-125 hover:shadow-sm transition-all"
                                      style={{ backgroundColor: getStageColorDot(app.stage) }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No applications linked yet</span>
                              )}
                            </td>

                            {/* Actions panel */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Create application Link button */}
                                <button
                                  onClick={() => onApplyToJobClick(cand.candidateId, cand.fullName)}
                                  title="Link application to open Job Position"
                                  className="py-1 px-2.5 rounded-lg border border-emerald-200 text-xs font-semibold text-[#2D6A4F] bg-white hover:bg-emerald-50 transition-all min-h-[44px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Slicon name="link" size={14} />
                                  Link Job
                                </button>

                                {/* Edit profile info details */}
                                <button
                                  onClick={() => onEditCandidateClick(cand)}
                                  title="Edit profile information"
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Slicon name="edit" size={16} />
                                </button>

                                {/* Cascade Delete profiles */}
                                <button
                                  onClick={() => onDeleteCandidateClick(cand.candidateId)}
                                  disabled={cand.hasHiredApplication}
                                  title={cand.hasHiredApplication ? "Deletions blocked: Candidate hired in position." : "Delete candidate completely"}
                                  className="p-1 text-gray-400 hover:text-red-650 rounded hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Slicon name="trash" size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ==========================================
                              EXPAND REVIEWS SUB-ROW DETAIL (R3.7)
                              ========================================== */}
                          {expanded && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={5} className="px-6 py-4 border-l-4 border-emerald-500 bg-emerald-50/10">
                                <div className="space-y-3.5">
                                  <h5 className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-widest flex items-center gap-1.5">
                                    <Slicon name="folder" size={14} />
                                    Chronological linked submissions ({candApps.length})
                                  </h5>

                                  {candApps.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">This candidate profile has not applied to any positions yet.</p>
                                  ) : (
                                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
                                      {candApps.map((app) => {
                                        const details = getAppFeedbackDetails(app.applicationId);
                                        return (
                                          <div key={app.applicationId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 text-xs hover:bg-gray-50/80 gap-3">
                                            {/* Left details */}
                                            <div className="space-y-1">
                                              <p className="font-bold text-gray-800">
                                                Position Applied: <span className="text-[#2D6A4F]">{app.jobTitle}</span>
                                              </p>
                                              <p className="text-[10px] text-gray-400 font-mono">
                                                App ID: {app.applicationId} · Applied on: {new Date(app.applicationDate).toLocaleDateString()}
                                              </p>
                                            </div>

                                            {/* Stage Badge & Scores indicator */}
                                            <div className="flex flex-wrap items-center gap-3">
                                              {/* Stage */}
                                              <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider text-white"
                                                style={{ backgroundColor: getStageColorDot(app.stage) }}
                                              >
                                                {app.stage}
                                              </span>

                                              {/* Evaluation */}
                                              <span className="px-2 py-0.5 bg-gray-100 border text-gray-600 rounded-md font-mono font-medium">
                                                Avg Score: <strong className="text-gray-800">{details.roundedAvg}</strong> ({details.count} evals)
                                              </span>

                                              {/* Outcome Badge system */}
                                              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${
                                                details.rec === "Strong Hire" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                                details.rec === "Hire" ? "bg-green-50 text-green-800 border-green-200" :
                                                details.rec === "Hold" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                                details.rec === "Reject" ? "bg-red-50 text-red-800 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"
                                              }`}>
                                                {details.rec}
                                              </span>
                                            </div>

                                            {/* Details Button */}
                                            <div>
                                              <button
                                                onClick={() => onNavigateToApplication(app.applicationId)}
                                                className="py-1.5 px-3 bg-slate-100 hover:bg-[#D8F3DC] hover:text-[#2D6A4F] rounded-lg font-bold text-gray-800 transition-all flex items-center gap-1 cursor-pointer min-h-[36px]"
                                              >
                                                View Details
                                                <Slicon name="chevron-right" size={13} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-[#F3F4F6]/20 py-3.5 px-6 border-t border-gray-100 text-xs text-gray-400 font-medium">
              Click the row chevron expand arrows to view evaluation histories, average interview scores, and detail breakdowns.
            </div>
          </div>

          {/* Floating Action Button Mobile master (FAB) */}
          <div className="md:hidden fixed bottom-20 right-6 z-40">
            <button
              onClick={onAddCandidateClick}
              className="w-14 h-14 rounded-full bg-[#2D6A4F] text-white shadow-xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#52B788] animate-bounce-slow active:scale-95 transition-all text-xl font-bold"
            >
              <Slicon name="user-plus" size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: APPLICATIONS LIST VIEW (R3.7)
          ========================================== */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Applications Combinatorial Filter panel */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search text query */}
              <div className="relative w-full sm:w-60">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                  <Slicon name="search" size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Filter candidate/job..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-205 focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                />
              </div>

              {/* Jobs */}
              <div className="min-w-[130px]">
                <select
                  className="w-full h-10 px-3 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                  value={appJobFilter}
                  onChange={(e) => setAppJobFilter(e.target.value)}
                >
                  <option value="all">All Jobs</option>
                  {jobs.map((j) => (
                    <option key={j.jobId} value={j.jobId}>
                      {j.title} ({j.jobId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stages list */}
              <div className="min-w-[110px]">
                <select
                  className="w-full h-10 px-3 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                  value={appStageFilter}
                  onChange={(e) => setAppStageFilter(e.target.value)}
                >
                  <option value="all">All Stages</option>
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Interview">Interview</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Offer">Offer</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Outcomes recommendations */}
              <div className="min-w-[120px]">
                <select
                  className="w-full h-10 px-3 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm"
                  value={appRecFilter}
                  onChange={(e) => setAppRecFilter(e.target.value)}
                >
                  <option value="all">All Recs</option>
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              {/* Clear */}
              {(appSearch || appJobFilter !== "all" || appStageFilter !== "all" || appRecFilter !== "all") && (
                <button
                  onClick={clearApplicationFilters}
                  className="px-3.5 h-10 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Slicon name="x" size={14} />
                  Clear
                </button>
              )}
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Filtered: {filteredApplications.length} cases
            </span>
          </div>

          {/* Applications Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm table-auto">
                <thead>
                  <tr className="bg-[#F0FAF4]/60 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 sticky left-0 bg-white md:bg-transparent z-10 w-[160px]">
                      Candidate Name
                    </th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Opening Job Tracker</th>
                    <th className="py-4 px-6">Pipeline Stage</th>
                    <th className="py-4 px-6 font-mono">Date</th>
                    <th className="py-4 px-6 text-right">View Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400">
                        <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                          <Slicon name="inbox" size={44} className="text-gray-300 mb-3" />
                          <p className="font-semibold text-gray-700 text-sm mb-1">No applications</p>
                          <p className="text-xs text-gray-400">Modify combined filters or publish openings.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedApplications.map((app, index) => {
                      // Determine consecutive candidate duplicates
                      const isSameCandidate =
                        index > 0 &&
                        paginatedApplications[index - 1].candidateId === app.candidateId;

                      return (
                        <tr
                          key={app.applicationId}
                          onClick={() => onNavigateToApplication(app.applicationId)}
                          className="hover:bg-[#F0FAF4]/10 transition-colors cursor-pointer"
                        >
                          {/* Name pinned left */}
                          <td className="py-4 px-6 sticky left-0 bg-white hover:bg-slate-50 md:bg-transparent z-10 font-bold text-gray-900 shadow-sm md:shadow-none min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <div>
                                <span>{app.candidateName}</span>
                                <span className="block text-[9px] font-mono text-gray-400 font-medium">
                                  {app.applicationId}
                                </span>
                              </div>
                              {isSameCandidate && (
                                <span className="text-[9px] bg-slate-150 text-gray-500 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide border font-mono">
                                  same
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-gray-600">
                            {/* Fetch candidate's email directly or fallback */}
                            {candidates.find((c) => c.candidateId === app.candidateId)?.email || "N/A"}
                          </td>

                          <td className="py-4 px-6">
                            <div>
                              <span className="block font-semibold text-gray-800">{app.jobTitle}</span>
                              <span className="text-[10px] font-mono text-gray-400 font-semibold block">
                                {app.jobId}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-sm"
                              style={{ backgroundColor: getStageColorDot(app.stage) }}
                            >
                              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                              {app.stage}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono text-gray-400 text-xs">
                            {new Date(app.applicationDate).toLocaleDateString()}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToApplication(app.applicationId);
                              }}
                              className="py-1.5 px-3.5 bg-slate-100 hover:bg-[#D8F3DC] hover:text-[#2D6A4F] rounded-lg font-bold text-xs text-gray-805 transition-all inline-flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                            >
                              Detail Page
                              <Slicon name="chevron-right" size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-[#F3F4F6]/20 py-4 px-6 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredApplications.length} total entries)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                    className="p-1 px-3.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[38px] flex items-center justify-center gap-1"
                  >
                    <Slicon name="chevron-left" size={14} />
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                    className="p-1 px-3.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-650 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[38px] flex items-center justify-center gap-1"
                  >
                    Next
                    <Slicon name="chevron-right" size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
