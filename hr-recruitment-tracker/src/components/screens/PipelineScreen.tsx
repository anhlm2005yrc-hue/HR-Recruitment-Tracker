import React, { useRef, useEffect } from "react";
import { Job, Application } from "../../types";
import { Slicon } from "../Slicon";

interface PipelineScreenProps {
  jobs: Job[];
  applications: Application[];
  selectedJobId: string;
  onSelectJobId: (jobId: string) => void;
  onPassApplication: (app: Application) => void;
  onRejectApplication: (app: Application) => void;
  onNavigateToApplication: (applicationId: string) => void;
}

export const PipelineScreen: React.FC<PipelineScreenProps> = ({
  jobs,
  applications,
  selectedJobId,
  onSelectJobId,
  onPassApplication,
  onRejectApplication,
  onNavigateToApplication,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Restore horizontal scroll on render
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("pipeline_board_scroll_x");
    if (savedScrollPos && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = parseInt(savedScrollPos, 10);
    }
  }, [selectedJobId]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem("pipeline_board_scroll_x", scrollContainerRef.current.scrollLeft.toString());
    }
  };

  const currentJob = jobs.find((j) => j.jobId === selectedJobId);
  const isJobClosed = currentJob?.status === "Closed";

  // Filter applications by selected jobId and active stages (excluding Terminal Stage: Rejected)
  const filteredApps = applications.filter(
    (app) => app.jobId === selectedJobId && app.stage !== "Rejected"
  );

  const columns: { stage: string; title: string; color: string }[] = [
    { stage: "Applied", title: "Applied", color: "border-blue-200 bg-blue-50/10 text-blue-800" },
    { stage: "Screening", title: "Screening", color: "border-emerald-200 bg-emerald-50/10 text-emerald-800" },
    { stage: "Interview", title: "Interview", color: "border-amber-200 bg-amber-50/10 text-amber-800" },
    { stage: "Assessment", title: "Assessment", color: "border-indigo-200 bg-indigo-50/10 text-indigo-800" },
    { stage: "Offer", title: "Offer", color: "border-pink-200 bg-pink-50/10 text-pink-850" },
    { stage: "Hired", title: "Hired (Terminal)", color: "border-teal-200 bg-teal-50/10 text-teal-800" },
  ];

  const getAppsForColumn = (stage: string) => {
    return filteredApps
      .filter((app) => app.stage === stage)
      .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top selection bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Interactive ATS Pipeline Board
          </h4>
          <p className="text-xs text-gray-400">
            Select a target position from the matching selector to populate the Kanban board workflow.
          </p>
        </div>

        {/* Selected Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs font-semibold text-gray-550 min-w-max uppercase tracking-wider">
            Sourcing Position:
          </label>
          <select
            className="h-11 px-4 bg-white border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52B788] text-sm font-semibold text-gray-800 min-w-[240px]"
            value={selectedJobId}
            onChange={(e) => onSelectJobId(e.target.value)}
          >
            <option value="">-- Choose Job Opening --</option>
            {jobs.map((j) => (
              <option key={j.jobId} value={j.jobId}>
                {j.title} · {j.department} ({j.jobId}) [{j.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Board view */}
      {!selectedJobId ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100 text-center flex-grow min-h-[380px]">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#2D6A4F] flex items-center justify-center mb-4">
            <Slicon name="settings" size={32} />
          </div>
          <h4 className="text-lg font-bold text-gray-850 tracking-tight">Select Open Position</h4>
          <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
            Choose a job from the mandatory dropdown above to load candidates and manage active hiring columns.
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex lg:grid lg:grid-cols-6 gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin select-none"
        >
          {columns.map((col) => {
            const columnApps = getAppsForColumn(col.stage);
            return (
              <div
                key={col.stage}
                className="flex flex-col flex-shrink-0 w-[280px] lg:w-auto h-[520px] bg-white rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden"
              >
                {/* Column Slicon Header */}
                <div className={`px-4 py-3.5 border-b flex items-center justify-between ${col.color}`}>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {col.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/70 rounded-full">
                    {columnApps.length}
                  </span>
                </div>

                {/* Sub board container scroll */}
                <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-gray-50/40 scrollbar-thin">
                  {columnApps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center text-gray-300">
                      <Slicon name="inbox" size={32} className="opacity-40 mb-1.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider block">
                        Empty Stage
                      </span>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const isHired = app.stage === "Hired";
                      return (
                        <div
                          key={app.applicationId}
                          onClick={() => onNavigateToApplication(app.applicationId)}
                          className="p-4 bg-white hover:bg-slate-50 border border-gray-150 rounded-xl shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer group"
                        >
                          {/* Inner info */}
                          <div>
                            {isJobClosed && (
                              <div className="mb-2 inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 text-[9px] font-bold uppercase tracking-wide">
                                <Slicon name="warning" size={10} />
                                Job Closed
                              </div>
                            )}

                            <span className="block text-sm font-bold text-gray-950 group-hover:text-[#2D6A4F] leading-snug">
                              {app.candidateName}
                            </span>
                            
                            <span className="block text-[10px] font-mono text-gray-400 mt-1">
                              App ID: {app.applicationId}
                            </span>
                          </div>

                          {/* Footer Action buttons: move forward or reject */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                            {/* Reject Trigger */}
                            {!isHired && (
                              <button
                                disabled={isJobClosed}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRejectApplication(app);
                                }}
                                title="Mark Application as Rejected"
                                className="h-8 px-2.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-1 flex-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer min-h-[38px]"
                              >
                                <Slicon name="x" size={12} />
                                Reject
                              </button>
                            )}

                            {/* Pass forward Trigger */}
                            {!isHired && (
                              <button
                                disabled={isJobClosed}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPassApplication(app);
                                }}
                                title="Pass Candidate to the Next Stage"
                                className="h-8 px-2.5 rounded-lg bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-1 flex-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer min-h-[38px]"
                              >
                                Pass
                                <Slicon name="chevron-right" size={12} />
                              </button>
                            )}

                            {isHired && (
                              <div className="w-full text-center text-[10px] font-extrabold text-[#2D6A4F] bg-emerald-50 border border-emerald-150 py-1.5 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Slicon name="check-circle" size={12} />
                                Completed Hire
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
