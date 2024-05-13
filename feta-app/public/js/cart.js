document.addEventListener('DOMContentLoaded', function () {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        document.getElementById('checkout-button').style.display = 'block';
        fetch('/api/menu')
            .then(response => response.json())
            .then(menuItems => {
                const itemCounts = cartItems.reduce((acc, id) => {
                    acc[id] = (acc[id] || 0) + 1;
                    return acc;
                }, {});

                const items = menuItems.data.filter(item => itemCounts[item.id]);

                let subtotal = 0;

                items.forEach(item => {
                    const quantity = itemCounts[item.id];
                    const itemSubtotal = item.price * quantity;
                    subtotal += itemSubtotal;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${item.name}</td>
                    <td><input type="number" value="${quantity}" min="0" onchange="updateQuantity('${item.id}', this.value)"></td>
                    <td>$${itemSubtotal.toFixed(2)}</td>
                `;
                    document.querySelector('#cart-table tbody').appendChild(row);
                });

                const tax = subtotal * 0.08875;
                const total = subtotal + tax;

                document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
                document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
                document.getElementById('total').textContent = `$${total.toFixed(2)}`;
            })
            .catch(error => console.error('Error loading cart:', error));
    }
    else {
        document.getElementById('checkout-button').style.display = 'none';
    }
    document.getElementById('checkout-button').addEventListener('click', function () {
        if (document.cookie.split('; ').find(row => row.startsWith('jwt='))) {
            window.location.href = '/checkout';
        } else {
            window.location.href = '/login';
        }
    });
});

function updateQuantity(itemId, quantity) {
    quantity = parseInt(quantity);
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const filteredItems = cartItems.filter(item => item !== itemId);
    const newCart = filteredItems.concat(Array(quantity).fill(itemId));
    localStorage.setItem('cart', JSON.stringify(newCart));
    location.reload();
}

