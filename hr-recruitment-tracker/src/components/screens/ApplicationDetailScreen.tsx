import React from "react";
import { Application, Feedback, Candidate } from "../../types";
import { Slicon } from "../Slicon";
import { calculateRecommendation } from "../../utils";

interface ApplicationDetailScreenProps {
  applicationId: string;
  application: Application;
  candidate?: Candidate;
  feedbacks: Feedback[];
  onBackClick: () => void;
  onAddFeedbackClick: (appId: string, candName: string) => void;
}

export const ApplicationDetailScreen: React.FC<ApplicationDetailScreenProps> = ({
  applicationId,
  application,
  candidate,
  feedbacks,
  onBackClick,
  onAddFeedbackClick,
}) => {
  const isHired = application.stage === "Hired";
  const isRejected = application.stage === "Rejected";

  // Calculate stats
  const feedbacksCount = feedbacks.length;
  
  const overallAvg =
    feedbacksCount > 0
      ? feedbacks.reduce(
          (acc, fb) => acc + (fb.technicalScore + fb.communicationScore + fb.cultureFitScore) / 3,
          0
        ) / feedbacksCount
      : 0;

  // CD5: Overall recommendation calculated from average of ALL feedback records, not just latest
  // Let's compute average technical, communication, culture fit across all items
  const avgTech =
    feedbacksCount > 0 ? feedbacks.reduce((acc, f) => acc + f.technicalScore, 0) / feedbacksCount : 0;
  const avgComm =
    feedbacksCount > 0 ? feedbacks.reduce((acc, f) => acc + f.communicationScore, 0) / feedbacksCount : 0;
  const avgCult =
    feedbacksCount > 0 ? feedbacks.reduce((acc, f) => acc + f.cultureFitScore, 0) / feedbacksCount : 0;

  const calculatedRec =
    feedbacksCount > 0
      ? calculateRecommendation({
          technical: Math.round(avgTech),
          communication: Math.round(avgComm),
          cultureFit: Math.round(avgCult),
        })
      : "Pending";

  const stagesList = ["Applied", "Screening", "Interview", "Assessment", "Offer", "Hired"];

  const getStageStepIndex = (stage: string) => stagesList.indexOf(stage);
  const currentStepIndex = getStageStepIndex(application.stage);

  // Chronological sort newest first
  const sortedFeedbacks = [...feedbacks].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  const getRecColor = (rec: string) => {
    switch (rec) {
      case "Strong Hire":
        return "bg-emerald-50 text-emerald-800 border-emerald-250";
      case "Hire":
        return "bg-green-50 text-green-800 border-green-200";
      case "Hold":
        return "bg-amber-50 text-amber-800 border-amber-250";
      case "Reject":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-400 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic top safety headers banner based on stage */}
      {isHired && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-[#2D6A4F] animate-fade-in-down shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Slicon name="check-circle" size={22} />
          </div>
          <div>
            <strong className="block text-sm font-bold uppercase tracking-wider">Hiring Goal Achieved</strong>
            <p className="text-xs text-emerald-700 mt-0.5 font-medium leading-relaxed">
              This candidate application has successfully advanced to the terminal hired stage! Sourcing cycles finalized.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 animate-fade-in-down shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Slicon name="x" size={22} className="text-red-650" />
          </div>
          <div>
            <strong className="block text-sm font-bold uppercase tracking-wider">Application Sourcing Closed</strong>
            <p className="text-xs text-red-700 mt-0.5 font-medium leading-relaxed">
              This candidate is marked as Rejected. Retained in database repositories for future opportunities.
            </p>
          </div>
        </div>
      )}

      {/* Primary header panel links back to applications */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150/80 shadow-sm">
        <button
          onClick={onBackClick}
          className="py-2 px-3.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
        >
          <Slicon name="chevron-left" size={14} />
          Back to Listings
        </button>

        <span className="text-xs text-gray-400 font-mono">
          Submission Code: {applicationId}
        </span>
      </div>

      {/* Split Cards: profile left, stats outline right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Master Profile left block wrapper */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm space-y-5">
          <div className="border-b pb-3.5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F0FAF4] text-[#2D6A4F] flex items-center justify-center mx-auto mb-3">
              <Slicon name="user" size={28} />
            </div>
            <h4 className="text-md font-extrabold text-gray-900 tracking-tight leading-snug">
              {application.candidateName}
            </h4>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-gray-400 block mt-0.5">
              Candidate Reference: {application.candidateId}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-3.5 text-xs">
            {/* Email */}
            <div>
              <span className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                Email Sourcing:
              </span>
              <span className="text-gray-800 font-medium">{candidate?.email || "N/A"}</span>
            </div>

            {/* Phone */}
            <div>
              <span className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                Mobile Contacts:
              </span>
              <span className="text-gray-800 font-mono font-medium">{candidate?.phone || "N/A"}</span>
            </div>

            {/* Position */}
            <div>
              <span className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                Targeted Position:
              </span>
              <strong className="text-[#2D6A4F]">{application.jobTitle}</strong>
              <span className="block font-mono text-[10px] text-gray-400">{application.jobId}</span>
            </div>

            {/* CV attachment link */}
            <div>
              <span className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-1">
                CV Attachment File:
              </span>
              <a
                href={application.cvLink}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3.5 bg-[#F0FAF4] hover:bg-[#D8F3DC] text-[#2D6A4F] rounded-lg font-bold border border-emerald-150 transition-all flex items-center justify-between max-w-max text-[11px]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Slicon name="paperclip" size={13} />
                  Open Candidate CV PDF
                </span>
                <Slicon name="external-link" size={12} className="ml-1.5" />
              </a>
            </div>

            {/* Applied stamp date */}
            <div>
              <span className="block text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                Linked Stamp Date:
              </span>
              <span className="text-gray-600 font-mono">
                {new Date(application.applicationDate).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Evaluations Overview Stats card right */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm space-y-5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-2">
            Assessment & Progress Metrics
          </h4>

          {/* Evaluations stats numbers card group */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stage */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Current Pipeline Stage
              </span>
              <span
                className="text-xs font-extrabold uppercase bg-[#D8F3DC] text-[#2D6A4F] border px-2.5 py-1 rounded-lg mt-2 max-w-max"
              >
                {application.stage}
              </span>
            </div>

            {/* Evaluations */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Assessment Evaluators
              </span>
              <strong className="text-2xl font-extrabold text-gray-805 mt-1.5 block">
                {feedbacksCount} Rounds
              </strong>
            </div>

            {/* Scores summary averages */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Overall Score
                </span>
                <strong className="text-3xl font-extrabold text-[#2D6A4F] font-mono leading-none block">
                  {overallAvg > 0 ? overallAvg.toFixed(1) : "N/A"}
                </strong>
                <span className="text-[9px] text-[#52B788] uppercase tracking-wide font-bold">
                  avg target / 5.0
                </span>
              </div>

              {feedbacksCount > 0 && (
                <span className={`px-2 py-1 rounded-md font-bold uppercase text-[10px] border tracking-wide ${getRecColor(calculatedRec)}`}>
                  {calculatedRec}
                </span>
              )}
            </div>
          </div>

          {/* 6-step progress process line bar indicator */}
          <div className="pt-4 border-t border-gray-50">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Detailed Stages Walkthrough:
            </span>

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-2 pt-2">
              {/* Back tracks line on desktop */}
              <div className="absolute hidden sm:block top-[10px] left-4 right-4 h-1 bg-gray-100 z-0" />

              {stagesList.map((stg, sIdx) => {
                const stepActive = sIdx <= currentStepIndex;
                const stepCurrent = sIdx === currentStepIndex;

                return (
                  <div key={stg} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-1.5 flex-1">
                    {/* The circle node */}
                    <div
                      className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 transition-all ${
                        stepCurrent
                          ? "bg-[#2D6A4F] border-[#2D6A4F] text-white scale-110 shadow-sm"
                          : stepActive
                          ? "bg-[#52B788] border-[#52B788] text-white"
                          : "bg-white border-gray-200 text-gray-300"
                      }`}
                    >
                      {stepActive && !stepCurrent ? (
                        <span className="text-[9px] font-bold">✔</span>
                      ) : (
                        <span className="text-[9px] font-bold font-mono">{sIdx + 1}</span>
                      )}
                    </div>

                    {/* Step label name */}
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider block ${
                        stepCurrent
                          ? "text-[#2D6A4F] font-bold"
                          : stepActive
                          ? "text-gray-700"
                          : "text-gray-300"
                      }`}
                    >
                      {stg}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Block: Chronicle list of feedbacks nested under applications */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-150/80 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-6">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
              Interview Evaluation Rounds History
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.2 rounded-full font-bold">
              {feedbacksCount}
            </span>
          </div>

          {/* Sourcing Add feedback action if in Interview stage */}
          {application.stage === "Interview" && (
            <button
              onClick={() => onAddFeedbackClick(applicationId, application.candidateName)}
              className="py-1.5 px-3 bg-[#2D6A4F] hover:bg-[#1A3A2E] text-white rounded-lg font-bold text-[11px] uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Slicon name="plus" size={13} />
              Submit assessment
            </button>
          )}
        </div>

        {/* Chronicle list matching */}
        <div className="space-y-4">
          {sortedFeedbacks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Slicon name="inbox" size={44} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700 text-sm mb-1">
                No interview feedback has been submitted yet.
              </p>
              <p className="text-xs text-gray-400">
                If candidate evaluates under interview steps, clicking Submit Assessment will register checklists.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sortedFeedbacks.map((fb) => {
                const fbAvg = (fb.technicalScore + fb.communicationScore + fb.cultureFitScore) / 3;
                return (
                  <div
                    key={fb.feedbackId}
                    className="p-5 border border-gray-150/80 rounded-2xl bg-gray-50/50 hover:bg-white shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between border-b border-gray-100 pb-2.5 mb-4">
                        <div>
                          <strong className="block text-sm font-bold text-gray-900 leading-snug">
                            {fb.interviewer}
                          </strong>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            Logged: {new Date(fb.createdDate).toLocaleDateString()} · ID: {fb.feedbackId}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border tracking-wide ${getRecColor(fb.recommendation)}`}>
                          {fb.recommendation}
                        </span>
                      </div>

                      {/* Scores */}
                      <div className="space-y-2.5">
                        {/* Tech */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-650 mb-0.5">
                            <span>Technical round</span>
                            <span>{fb.technicalScore} / 5</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(fb.technicalScore / 5) * 100}%` }} />
                          </div>
                        </div>

                        {/* Comm */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-650 mb-0.5">
                            <span>Communication round</span>
                            <span>{fb.communicationScore} / 5</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(fb.communicationScore / 5) * 100}%` }} />
                          </div>
                        </div>

                        {/* Culture */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-650 mb-0.5">
                            <span>Culture fit round</span>
                            <span>{fb.cultureFitScore} / 5</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(fb.cultureFitScore / 5) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Feedback logs comments:</span>
                      <p className="text-xs text-gray-600 leading-relaxed italic block">
                        {fb.comments ? `"${fb.comments}"` : "No Comments."}
                      </p>
                    </div>

                    {/* Footer Score */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400">
                      <span>Total score in round:</span>
                      <span className="text-[#2D6A4F] font-bold font-mono">{fbAvg.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
