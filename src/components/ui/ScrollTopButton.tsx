"use client";

export default function ScrollTopButton() {
  return (
    <button id="scrollTopBtn" className="scroll-top-btn" aria-label="Kembali ke atas" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <i className="fa-solid fa-chevron-up"></i>
    </button>
  );
}
