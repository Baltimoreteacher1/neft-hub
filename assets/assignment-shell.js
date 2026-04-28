const searchInput = document.querySelector('#assignmentSearch');
const filterSelect = document.querySelector('#assignmentFilter');
const cards = Array.from(document.querySelectorAll('.assignment-card'));

function filterAssignments() {
  if (!cards.length) return;
  const query = (searchInput?.value || '').toLowerCase().trim();
  const category = filterSelect?.value || 'all';

  cards.forEach((card) => {
    const title = card.dataset.title || card.textContent.toLowerCase();
    const cardCategory = card.dataset.category || 'all';
    const matchesQuery = !query || title.includes(query);
    const matchesCategory = category === 'all' || cardCategory === category;
    card.hidden = !(matchesQuery && matchesCategory);
  });
}

searchInput?.addEventListener('input', filterAssignments);
filterSelect?.addEventListener('change', filterAssignments);

const tabGroups = document.querySelectorAll('[data-tabs]');

tabGroups.forEach((group) => {
  const buttons = Array.from(group.querySelectorAll('[role="tab"]'));
  const panels = Array.from(group.querySelectorAll('[role="tabpanel"]'));

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('aria-controls');

      buttons.forEach((btn) => btn.setAttribute('aria-selected', String(btn === button)));
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === targetId));
    });
  });
});
