window.onload = function () {
    fetchMenuItems();
};

function fetchMenuItems() {
    fetch('/api/menu')
        .then(response => response.json())
        .then(data => {
            const menuItems = data.data;
            const appetizersContainer = document.querySelector(".menu_column:nth-child(1) .line_divide");
            const entreesContainer = document.querySelector(".menu_column:nth-child(2) .line_divide");
            const dessertsContainer = document.querySelector(".menu_column:nth-child(3) .line_divide");

            menuItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'menu_item';
                itemElement.setAttribute('id', item.id);
                itemElement.innerHTML = `
                    <div class="menu_item_header">
                        <h2>${item.name}</h2>
                        <button class="btn_add_cart">
                            <i class='bx bx-plus-medical'></i>
                        </button>
                    </div>
                    <h3>$${item.price.toFixed(2)}</h3>
                    <p>${item.description}</p>
                `;

                switch (item.type) {
                    case "appetizer":
                        appetizersContainer.parentNode.insertBefore(itemElement, appetizersContainer.nextSibling);
                        break;
                    case "entree":
                        entreesContainer.parentNode.insertBefore(itemElement, entreesContainer.nextSibling);
                        break;
                    case "dessert":
                        dessertsContainer.parentNode.insertBefore(itemElement, dessertsContainer.nextSibling);
                        break;
                }
            });
            addEventListeners();
        })
        .catch(error => console.error('Error fetching menu items:', error));
}

function addEventListeners() {
    const buttons = document.querySelectorAll('.btn_add_cart');
    buttons.forEach(button => {
        button.addEventListener('click', function (event) {
            const menuItemDiv = this.closest('.menu_item');
            const itemId = menuItemDiv.id;
            addToCart(itemId);
        });
    });
}

function addToCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Item added to cart!`);
}