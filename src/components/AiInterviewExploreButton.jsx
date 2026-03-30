import React from "react";

function AiInterviewExploreButton({ onClick, className = "", ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ai-interview-explore-btn ${className}`.trim()}
      style={{ "--clr": "#7808d0" }}
      aria-label="Explore AI interview"
      {...rest}
    >
      <span className="ai-interview-explore-btn__icon-wrapper">
        <svg
          viewBox="0 0 14 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="ai-interview-explore-btn__icon-svg"
          width="10"
          height="10"
          aria-hidden="true"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>
        <svg
          viewBox="0 0 14 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="ai-interview-explore-btn__icon-svg ai-interview-explore-btn__icon-svg--copy"
          width="10"
          height="10"
          aria-hidden="true"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>
      </span>
      Explore AI interview
    </button>
  );
}

export default AiInterviewExploreButton;
