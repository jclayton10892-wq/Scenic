
// quote-mobile.js
// Adds data-label attributes to <td> cells using their column headers.
// Call initQuoteMobileLabels() after the table is rendered.

export function initQuoteMobileLabels(selector = "table.quote-table") {
  const table = document.querySelector(selector);
  if (!table) return;

  const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
  if (!headers.length) return;

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    cells.forEach((td, i) => {
      if (!td.getAttribute("data-label") && headers[i]) {
        td.setAttribute("data-label", headers[i]);
      }
      // Ensure inputs expand full width
      const input = td.querySelector("input, select, textarea");
      if (input) {
        input.style.width = "100%";
      }
    });
  });
}

// Auto-run on DOMContentLoaded for simple installs
document.addEventListener("DOMContentLoaded", () => {
  initQuoteMobileLabels();
});
