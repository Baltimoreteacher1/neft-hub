const searchBox = document.querySelector('#searchBox');
const categoryFilter = document.querySelector('#categoryFilter');
const cards = Array.from(document.querySelectorAll('.app-card'));

function filterCards() {
  const query = (searchBox?.value || '').trim().toLowerCase();
  const category = categoryFilter?.value || 'all';

  cards.forEach((card) => {
    const searchable = card.dataset.title || card.textContent.toLowerCase();
    const cardCategory = card.dataset.category || '';
    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = category === 'all' || cardCategory === category;
    card.hidden = !(matchesQuery && matchesCategory);
  });
}

searchBox?.addEventListener('input', filterCards);
categoryFilter?.addEventListener('change', filterCards);
