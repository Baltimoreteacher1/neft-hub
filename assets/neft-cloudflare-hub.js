const searchBox = document.querySelector('#searchBox');
const categoryFilter = document.querySelector('#categoryFilter');
const cards = Array.from(document.querySelectorAll('.app-card'));
const groups = Array.from(document.querySelectorAll('.app-group'));

function filterCards() {
  const query = (searchBox?.value || '').trim().toLowerCase();
  const selectedGroup = categoryFilter?.value || 'all';

  cards.forEach((card) => {
    const searchable = card.dataset.title || card.textContent.toLowerCase();
    const cardGroup = card.dataset.group || '';
    const matchesQuery = !query || searchable.includes(query);
    const matchesGroup = selectedGroup === 'all' || cardGroup === selectedGroup;
    card.hidden = !(matchesQuery && matchesGroup);
  });

  groups.forEach((group) => {
    const groupCards = Array.from(group.querySelectorAll('.app-card'));
    group.hidden = groupCards.every((card) => card.hidden);
  });
}

searchBox?.addEventListener('input', filterCards);
categoryFilter?.addEventListener('change', filterCards);
