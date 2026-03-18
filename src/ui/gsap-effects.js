import gsap from "gsap";

export function initMagneticButtons() {
  const buttons = document.querySelectorAll(
    ".sync-btn, .add-item-btn, .bills-btn",
  );

  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const { left, top, width, height } = btn.getBoundingClientRect();
      const x = e.clientX - (left + width / 2);
      const y = e.clientY - (top + height / 2);

      // Subtle magnetic pull
      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    });
  });
}
