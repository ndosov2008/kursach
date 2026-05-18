document.addEventListener('DOMContentLoaded', async () => {
    const bookingForm = document.getElementById('bookingForm');
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const roomType = document.getElementById('roomType');
    const mealType = document.getElementById('mealType');

    const nightsCount = document.getElementById('nightsCount');
    const mealSummary = document.getElementById('mealSummary');
    const oldPriceDisplay = document.getElementById('oldPrice');
    const totalPrice = document.getElementById('totalPrice');
    const discountItem = document.getElementById('discountItem');
    const discountValueDisplay = document.getElementById('discountValue');

    const promoInput = document.getElementById('promoCode');
    const applyBtn = document.getElementById('applyPromo');
    const promoMsg = document.getElementById('promoMessage');
    const toast = document.getElementById('toast');

    let appliedDiscountPercent = 0;

    function getAmenityIcons(amenitiesText) {
        const iconMap = [
            { keywords: ['Wi-Fi', 'wifi'], icon: 'fa-wifi' },
            { keywords: ['ТВ', 'Smart TV'], icon: 'fa-tv' },
            { keywords: ['Кондиционер'], icon: 'fa-snowflake' },
            { keywords: ['Кофе'], icon: 'fa-coffee' },
            { keywords: ['Рабочая'], icon: 'fa-briefcase' },
            { keywords: ['комнат'], icon: 'fa-users' },
            { keywords: ['Кухня'], icon: 'fa-utensils' },
            { keywords: ['Ванна', 'Джакузи', 'Душ'], icon: 'fa-bath' },
            { keywords: ['Suite'], icon: 'fa-couch' },
            { keywords: ['Панорам', 'вид'], icon: 'fa-city' },
            { keywords: ['Акустика', 'Marshall'], icon: 'fa-music' },
            { keywords: ['Терраса'], icon: 'fa-glass-martini-alt' },
            { keywords: ['VIP', 'Royal', 'Lux'], icon: 'fa-crown' },
            { keywords: ['консьерж', 'сервис'], icon: 'fa-concierge-bell' },
            { keywords: ['Сейф'], icon: 'fa-lock' }
        ];

        const icons = new Set();
        const lowerText = amenitiesText.toLowerCase();

        iconMap.forEach(({ keywords, icon }) => {
            if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
                icons.add(icon);
            }
        });

        if (icons.size === 0) {
            icons.add('fa-check');
        }

        return Array.from(icons).map(icon => `<i class="fas ${icon}"></i>`).join(' ');
    }

    function renderRoomsGrid(rooms) {
        const grid = document.querySelector('.grid');
        if (!grid) return;

        grid.innerHTML = '';

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="img/${room.id}.png" alt="${room.name}">
                <div class="content">
                    <h3>${room.name}</h3>
                    <div class="amenities" style="color: #b08d57; font-size: 13px; margin: 10px 0;">
                        ${getAmenityIcons(room.amenities)}
                    </div>
                    <p>${room.amenities}</p>
                    <span style="display:block; margin: 15px 0; font-weight: 700;">${room.price}</span>
                    <a href="booking.html" class="btn btn-outline">Выбрать</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderRoomSelect(rooms) {
        const select = document.getElementById('roomType');
        if (!select) return;

        select.innerHTML = '';

        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.priceValue;
            option.textContent = `${room.name} — ${room.price}`;
            select.appendChild(option);
        });
    }

    async function loadHotelData() {
        try {
            const response = await fetch('data.xml');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const roomNodes = xmlDoc.querySelectorAll('room');

            const rooms = Array.from(roomNodes).map(roomNode => {
                const priceText = roomNode.querySelector('price')?.textContent.trim() || '0 BYN';

                return {
                    id: roomNode.getAttribute('id'),
                    name: roomNode.querySelector('name')?.textContent.trim() || '',
                    price: priceText,
                    priceValue: parseInt(priceText, 10) || 0,
                    amenities: roomNode.querySelector('amenities')?.textContent.trim() || ''
                };
            });

            renderRoomsGrid(rooms);
            renderRoomSelect(rooms);

            return rooms;
        } catch (error) {
            console.error('Не удалось загрузить data.xml:', error);
            return [];
        }
    }

    await loadHotelData();

    function validateDates() {
        if (!checkIn || !checkOut) return true;
        const arrival = new Date(checkIn.value);
        const departure = new Date(checkOut.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkIn.value && arrival < today) {
            alert("Дата заезда не может быть в прошлом!");
            checkIn.value = "";
            return false;
        }

        if (checkIn.value && checkOut.value && departure <= arrival) {
            alert("Дата выезда должна быть позже даты заезда!");
            checkOut.value = "";
            return false;
        }
        return true;
    }

    function calculateTotal() {
        if (!checkIn || !checkOut || !roomType || !mealType) return;
        
        if (!validateDates()) {
            if (nightsCount) nightsCount.innerText = '0';
            if (totalPrice) totalPrice.innerText = '0 BYN';
            if (oldPriceDisplay) oldPriceDisplay.style.display = 'none';
            if (discountItem) discountItem.style.display = 'none';
            return;
        }

        if (!checkIn.value || !checkOut.value) return;

        const date1 = new Date(checkIn.value);
        const date2 = new Date(checkOut.value);
        const priceRoom = parseInt(roomType.value) || 0;
        const priceMeal = parseInt(mealType.value) || 0;

        const diffDays = Math.ceil(Math.abs(date2 - date1) / (1000 * 3600 * 24));
        let totalBase = diffDays * (priceRoom + priceMeal);

        let autoDiscount = (diffDays >= 7) ? 0.30 : 0;
        let finalPercent = Math.max(autoDiscount, appliedDiscountPercent);

        if (mealSummary && mealType) {
            const mealText = mealType.options[mealType.selectedIndex].text;
            mealSummary.innerText = mealText.split(' —')[0].split(' (')[0];
        }

        if (nightsCount) nightsCount.innerText = diffDays;

        if (finalPercent > 0) {
            let discountSum = totalBase * finalPercent;
            let finalSum = totalBase - discountSum;

            if (oldPriceDisplay) {
                oldPriceDisplay.innerText = Math.round(totalBase) + ' BYN';
                oldPriceDisplay.style.display = 'block';
            }
            if (totalPrice) totalPrice.innerText = Math.round(finalSum) + ' BYN';
            if (discountItem) discountItem.style.display = 'flex';
            if (discountValueDisplay) discountValueDisplay.innerText = '-' + Math.round(discountSum) + ' BYN';
        } else {
            if (oldPriceDisplay) oldPriceDisplay.style.display = 'none';
            if (totalPrice) totalPrice.innerText = Math.round(totalBase) + ' BYN';
            if (discountItem) discountItem.style.display = 'none';
        }
    }

    if (checkIn && checkOut && roomType && mealType) {
        [checkIn, checkOut, roomType, mealType].forEach(el => {
            if (el) el.addEventListener('change', calculateTotal);
        });
    }

    if (applyBtn && promoInput && promoMsg) {
        applyBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            const arrivalDate = new Date(checkIn.value);
            const today = new Date();
            const daysToArrival = Math.ceil((arrivalDate - today) / (1000 * 3600 * 24));

            if (code === 'EARLY20') {
                if (daysToArrival >= 30) {
                    appliedDiscountPercent = 0.20;
                    promoMsg.innerText = "✓ Промокод применен (-20%)";
                    promoMsg.style.color = "#27ae60";
                } else {
                    promoMsg.innerText = "✕ Нужно бронировать минимум за 30 дней";
                    promoMsg.style.color = "#e74c3c";
                    appliedDiscountPercent = 0;
                }
            } else if (code === 'ROMANCE') {
                appliedDiscountPercent = 0.15;
                promoMsg.innerText = "✓ Скидка 15% за романтик!";
                promoMsg.style.color = "#b08d57";
            } else {
                promoMsg.innerText = "✕ Неверный код";
                promoMsg.style.color = "#e74c3c";
                appliedDiscountPercent = 0;
            }
            calculateTotal();
        });
    }

    const subscribeForm = document.querySelector('.main-footer form');
    if (subscribeForm && toast) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = subscribeForm.querySelector('input').value;
            if (email) {
                toast.innerHTML = `<i class="fas fa-check-circle"></i> Успешно! Письмо отправлено на ${email}`;
                toast.classList.add('active');
                subscribeForm.reset();
                setTimeout(() => toast.classList.remove('active'), 4000);
            }
        });
    }

    if (bookingForm && checkIn && checkOut && toast) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!checkIn.value || !checkOut.value) {
                alert("Пожалуйста, выберите даты!");
                return;
            }
            toast.innerHTML = `<i class="fas fa-check-circle"></i> Бронирование успешно оформлено!`;
            toast.classList.add('active');
            setTimeout(() => {
                toast.classList.remove('active');
                window.location.href = 'index.html';
            }, 3000);
        });
    }

    const currentUrl = window.location.pathname.split("/").pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentUrl) {
            link.classList.add('active');
        }
    });

    let burger = document.querySelector('.burger');
    
    if (!burger) {
        burger = document.createElement('button');
        burger.className = 'burger';
        burger.innerHTML = '<span></span><span></span><span></span>';
        const navFlex = document.querySelector('.main-header .nav-flex');
        if (navFlex) navFlex.appendChild(burger);
    }
    
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }
    
    const navMenu = document.querySelector('.nav-menu');

    if (navMenu && !navMenu.querySelector('.mobile-booking-btn')) {
        const bookingLi = document.createElement('li');
        bookingLi.className = 'mobile-booking-btn';
        bookingLi.innerHTML = '<a href="booking.html">Забронировать</a>';
        navMenu.appendChild(bookingLi);
    }
    
    function toggleMenu() {
        if (!burger || !navMenu || !overlay) return;
        burger.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('menu-open', navMenu.classList.contains('active'));
    }
    
    function closeMenu() {
        if (!burger || !navMenu || !overlay) return;
        burger.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    if (burger && navMenu) {
        burger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
        
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
});