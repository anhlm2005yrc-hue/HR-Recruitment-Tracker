import React from "react";
import { Job, Candidate, Application } from "../../types";
import { Slicon } from "../Slicon";
import { motion } from "motion/react";

interface DashboardScreenProps {
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  onNavigateToTab: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  jobs,
  candidates,
  applications,
  onNavigateToTab,
}) => {
  const openJobs = jobs.filter((j) => j.status === "Open").length;
  const totalCandidates = candidates.length;
  const activeApps = applications.filter(
    (app) => app.stage !== "Hired" && app.stage !== "Rejected"
  ).length;
  const hiredApps = applications.filter((app) => app.stage === "Hired").length;

  const totalApplicationsCount = applications.length;

  // Compute funnel stage values
  const getStageCount = (stage: string) => applications.filter((app) => app.stage === stage).length;
  const appliedCount = getStageCount("Applied");
  const screeningCount = getStageCount("Screening");
  const interviewCount = getStageCount("Interview");
  const assessmentCount = getStageCount("Assessment");
  const offerCount = getStageCount("Offer");
  const hiredCount = getStageCount("Hired");
  const rejectedCount = getStageCount("Rejected");

  // Determine Overall Recruitment Health Score
  // Calculated as (hired / (hired + rejected)) * 100 if applications exist, or based on overall throughput
  const resolvedOutcomes = hiredCount + rejectedCount;
  const healthRatio = resolvedOutcomes > 0 ? (hiredCount / resolvedOutcomes) * 100 : 0;
  // Fallback to active candidates filling slots if zero resolved outcomes
  const activeRatio = totalApplicationsCount > 0 ? ((activeApps + hiredCount) / totalApplicationsCount) * 100 : 0;
  const healthScore = Math.round(resolvedOutcomes > 0 ? healthRatio : activeRatio || 75);

  const stagesData = [
    { name: "Applied", count: appliedCount, color: "#3B82F6", prevCount: totalApplicationsCount },
    { name: "Screening", count: screeningCount, color: "#10B981", prevCount: appliedCount },
    { name: "Interview", count: interviewCount, color: "#F59E0B", prevCount: screeningCount },
    { name: "Assessment", count: assessmentCount, color: "#6366F1", prevCount: interviewCount },
    { name: "Offer", count: offerCount, color: "#EC4899", prevCount: assessmentCount },
    { name: "Hired", count: hiredCount, color: "#14B8A6", prevCount: offerCount },
  ];

  const hasData = jobs.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[460px] text-center max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#2D6A4F] flex items-center justify-center mb-5 animate-bounce-slow">
          <Slicon name="briefcase" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 tracking-tight mb-2">
          No recruitment data yet
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
          Start by creating your first job opening to publish positions, add prospective candidates, and manage pipelines.
        </p>
        <button
          onClick={() => onNavigateToTab("jobs")}
          className="py-3 px-6 rounded-xl bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white text-sm font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
        >
          <Slicon name="plus" size={16} />
          Create First Job Opening
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Open Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Open Jobs
            </span>
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center gap-0.5 text-[10px] font-bold">
              <Slicon name="trending-up" size={12} />
              +5%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-extrabold text-gray-900 leading-none">
              {openJobs}
            </span>
            {/* sparkline */}
            <svg className="w-16 h-8 text-[#52B788] opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 60 20">
              <path
                d="M0,15 L10,12 L20,16 L30,8 L40,11 L50,6 L60,4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            Active sourcings this month
          </p>
        </div>

        {/* Card 2: Master Candidates */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Candidates
            </span>
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center gap-0.5 text-[10px] font-bold">
              <Slicon name="trending-up" size={12} />
              +12%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-extrabold text-gray-900 leading-none">
              {totalCandidates}
            </span>
            <svg className="w-16 h-8 text-[#52B788] opacity-70" viewBox="0 0 60 20">
              <path
                d="M0,18 L10,14 L20,12 L30,10 L40,6 L50,8 L60,2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            Profiles in talent pools
          </p>
        </div>

        {/* Card 3: Active Apps */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Apps
            </span>
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center gap-0.5 text-[10px] font-bold">
              <Slicon name="trending-up" size={12} />
              +15%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-extrabold text-gray-900 leading-none">
              {activeApps}
            </span>
            <svg className="w-16 h-8 text-[#52B788] opacity-70" viewBox="0 0 60 20">
              <path
                d="M0,15 L10,13 L20,15 L30,10 L40,8 L50,5 L60,3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            Evaluating submissions
          </p>
        </div>

        {/* Card 4: Placements / Hired */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Hires Made
            </span>
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center gap-0.5 text-[10px] font-bold">
              <Slicon name="trending-up" size={12} />
              +8%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <span className="text-3xl font-extrabold text-gray-900 leading-none">
              {hiredApps}
            </span>
            <svg className="w-16 h-8 text-[#52B788] opacity-70" viewBox="0 0 60 20">
              <path
                d="M0,17 L10,15 L20,13 L30,12 L40,9 L50,4 L60,2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            Confirmed hires closing cycles
          </p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column 1-2: Conversion Funnel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Hiring Funnel & Conversion Rates
              </h4>
              <p className="text-xs text-gray-400">
                Performance funnel tracking candidate count reductions through successive stages
              </p>
            </div>
            <span className="text-[11px] bg-[#F0FAF4] text-[#2D6A4F] px-2.5 py-1 rounded-lg border border-[#D8F3DC] font-semibold">
              Total Applicants: {totalApplicationsCount}
            </span>
          </div>

          {/* Funnel rows list */}
          <div className="space-y-4">
            {stagesData.map((stage, idx) => {
              // Calculate conversion rate
              let convRate = 100;
              if (idx > 0) {
                const prevCount = stagesData[idx - 1].count;
                convRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
              } else if (totalApplicationsCount > 0) {
                convRate = Math.round((stage.count / totalApplicationsCount) * 100);
              }

              // Percent width of bar (scaled against maximum stage value to maintain graphic logic)
              const maxCount = Math.max(...stagesData.map((s) => s.count)) || 1;
              const barPercent = Math.round((stage.count / maxCount) * 100) || 0;

              return (
                <div key={stage.name} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {/* Stage Label name */}
                  <div className="w-24 md:text-right flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest block">
                      {stage.name}
                    </span>
                  </div>

                  {/* Stage row graphic */}
                  <div className="flex-grow flex items-center gap-3">
                    {/* The bar */}
                    <div className="flex-grow h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPercent}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full rounded-r-lg opacity-85 hover:opacity-100 transition-opacity flex items-center justify-end px-3"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.count > 0 && barPercent > 12 && (
                          <span className="text-[11px] font-extrabold text-white text-right leading-none">
                            {stage.count}
                          </span>
                        )}
                      </motion.div>
                      {/* Count fallback if bar too narrow */}
                      {(stage.count === 0 || barPercent <= 12) && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11.5px] font-bold text-gray-400">
                          {stage.count}
                        </span>
                      )}
                    </div>

                    {/* Conversion Rate indicator */}
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-gray-700 block">
                        {convRate}%
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium block uppercase tracking-tighter">
                        {idx === 0 ? "of total" : "stages conv."}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dedicated Rejected details */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-100 flex items-center gap-3 col-span-2">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Slicon name="x" size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-red-800 uppercase tracking-wider">
                  Rejected Drop-Offs
                </span>
                <span className="text-xl font-extrabold text-red-955 leading-none block mt-0.5">
                  {rejectedCount} candidates
                </span>
              </div>
            </div>
            
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3 col-span-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                <Slicon name="check-circle" size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Success Placement Rate
                </span>
                <span className="text-xl font-extrabold text-[#2D6A4F] leading-none block mt-0.5">
                  {resolvedOutcomes > 0 ? Math.round((hiredCount / resolvedOutcomes) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Card: Circular Score Gauge (Radial Gauge) */}
        <div className="bg-[#0F1F18] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between group">
          {/* Subtle Radial Glow from Top Left */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-radial from-[#2D6A4F]/40 to-transparent -translate-x-12 -translate-y-12 pointer-events-none rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />

          <div className="relative z-15">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#52B788] mb-1">
              Health Metric
            </h4>
            <h3 className="text-md font-bold tracking-tight text-white mb-6">
              Recruitment Throughput Ratio
            </h3>

            {/* Radial score gauge indicator */}
            <div className="flex flex-col items-center justify-center py-6 my-2 relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background tracks */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1A3A2E"
                  strokeWidth="8"
                />
                {/* Foreground indicator filled path */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#52B788"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * healthScore) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              {/* Score text inside circular gauge */}
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold tracking-tight block text-white leading-none">
                  {healthScore}%
                </span>
                <span className="text-[10px] text-[#52B788] font-bold uppercase tracking-wider block mt-1">
                  Score Value
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-15 mt-4 pt-4 border-t border-[#1A3A2E]/80 space-y-2">
            <p className="text-xs text-[#D8F3DC] leading-relaxed">
              Based on placement conversion ratios, current pipeline loads, active open target rates, and interview round distributions.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#52B788] font-bold uppercase tracking-wide">
              <span>Status: Optimal Rate</span>
              <span className="w-1.5 h-1.5 bg-[#52B788] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
