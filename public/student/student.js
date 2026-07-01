const socket = io();
let allStores = [];

const foodImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
  'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80',
];

socket.on('menu-updated', () => loadMenu());

async function loadMenu() {
  const res = await fetch('/api/menu');
  allStores = await res.json();
  renderStores(allStores);
}

function renderStores(stores) {
  const list = document.getElementById('store-list');
  list.innerHTML = '';

  stores.forEach((store, idx) => {
    const card = document.createElement('div');
    card.className = `stall-card ${store.is_open ? '' : 'closed'}`;
    const imgUrl = foodImages[idx] || foodImages[0];

    card.innerHTML = `
      <div class="stall-image" style="background-image: url('${imgUrl}')">
        <div class="stall-badge">Stall ${store.store_id}</div>
        <div class="stall-status ${store.is_open ? 'open' : 'closed-badge'}">
          ${store.is_open ? 'Open' : 'Closed'}
        </div>
        <div class="stall-name">${store.store_name}</div>
      </div>
      <div class="stall-menu">
        <div class="best-sellers-label">Best Sellers</div>
        ${store.items.length === 0
          ? '<div class="no-menu">No menu available yet</div>'
          : store.items.map(item => `
              <div class="menu-row">
                <span>${item.item_name}</span>
                <span class="price">₱${item.price}</span>
              </div>
            `).join('')
        }
      </div>
    `;

    list.appendChild(card);
  });
}

document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  if (!query) { renderStores(allStores); return; }
  const filtered = allStores.filter(store =>
    store.store_name.toLowerCase().includes(query) ||
    store.items.some(item => item.item_name.toLowerCase().includes(query))
  );
  renderStores(filtered);
});

loadMenu();