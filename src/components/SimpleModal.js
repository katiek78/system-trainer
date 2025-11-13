import React from "react";

export default function SimpleModal({ open, onClose, children }) {
  if (!open) return null;
  // Responsive modal positioning: top center on desktop, centered on mobile
  const modalContainerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const modalContentStyle = {
    background: "#fff",
    borderRadius: 12,
    paddingTop: 20,
    minWidth: 320,
    minHeight: 200,
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
    position: "relative",
    // Default: center vertically (mobile)
    marginTop: 0,
    transition: "margin-top 0.3s",
  };
  // If desktop, move modal to top (room for digits below)
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    modalContainerStyle.alignItems = "flex-start";
    modalContentStyle.marginTop = 3;
  }
  return (
    <div style={modalContainerStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 24,
            fontWeight: "bold",
            color: "#222",
            cursor: "pointer",
            lineHeight: 1,
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: "50%",
            transition: "background 0.2s, color 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            zIndex: 10,
          }}
          aria-label="Close details modal"
          title="Close"
          onClick={onClose}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f2f2f2";
            e.currentTarget.style.color = "#d32f2f";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#222";
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
