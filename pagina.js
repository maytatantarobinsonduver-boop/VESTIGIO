// =============================================
// ========== ESTADO Y PERSISTENCIA ============
// =============================================
const CART_KEY = 'vestigio_cart';

let cart = loadCart();

function loadCart() {
    try {
        const saved = localStorage.getItem(CART_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

const cartIcon = document.getElementById('cartIcon');
const cartCount = document.getElementById('cartCount');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutError = document.getElementById('checkoutError');
const thanksModal = document.getElementById('thanksModal');
const thanksMessage = document.getElementById('thanksMessage');
const closeThanks = document.getElementById('closeThanks');

// =============================================
// ========== MENÚ HAMBURGUESA =================
// =============================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isOpen);
        const icon = navToggle.querySelector('i');
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    });
}
document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
        const icon = navToggle.querySelector('i');
        if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); }
    });
});

// =============================================
// ========== CARRITO ==========================
// =============================================

document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const el = e.currentTarget;
        const name = el.dataset.name;
        const price = parseFloat(el.dataset.price);

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) existingItem.quantity += 1;
        else cart.push({ name, price, quantity: 1 });

        saveCart();
        updateCartUI();
        pulseCart();

        const originalText = 'Adquirir';
        el.innerText = 'Añadido ✓';
        el.disabled = true;
        setTimeout(() => { el.innerText = originalText; el.disabled = false; }, 1200);
    });
});

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function pulseCart() {
    cartIcon.classList.add('pulse');
    setTimeout(() => cartIcon.classList.remove('pulse'), 500);
}

cartIcon.addEventListener('click', () => {
    if (cart.length === 0) {
        showToast('Tu bolsa está vacía. Explora la colección.');
        return;
    }
    renderCheckoutSummary();
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeCheckout.addEventListener('click', closeCheckoutModal);
checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (checkoutModal.classList.contains('active')) closeCheckoutModal();
        if (thanksModal.classList.contains('active')) closeThanksModal();
    }
});

function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCheckoutSummary() {
    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        html += `<div class="checkout-item">
            <span class="checkout-item__name">${item.name}</span>
            <div class="checkout-item__controls">
                <button type="button" data-action="decrease" data-index="${index}" aria-label="Quitar uno">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-action="increase" data-index="${index}" aria-label="Agregar uno">+</button>
                <button type="button" data-action="remove" data-index="${index}" aria-label="Eliminar">🗑</button>
            </div>
            <span class="checkout-item__price">$${item.price * item.quantity} USD</span>
        </div>`;
        total += item.price * item.quantity;
    });
    html += `<div class="checkout-total"><span>Total</span><span>$${total} USD</span></div>`;
    checkoutSummary.innerHTML = html;

    checkoutSummary.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', handleCartAction);
    });
}

function handleCartAction(e) {
    const action = e.currentTarget.dataset.action;
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(index) || !cart[index]) return;

    if (action === 'increase') cart[index].quantity += 1;
    if (action === 'decrease') {
        cart[index].quantity -= 1;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
    }
    if (action === 'remove') cart.splice(index, 1);

    saveCart();
    updateCartUI();

    if (cart.length === 0) {
        closeCheckoutModal();
        showToast('Tu bolsa está vacía.');
        return;
    }
    renderCheckoutSummary();
}

// =============================================
// ========== MÉTODOS DE PAGO ==================
// =============================================
const paymentRadios = document.querySelectorAll('input[name="payment"]');
const cardDetails = document.getElementById('cardDetails');
const otherPaymentInfo = document.getElementById('otherPaymentInfo');

paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'Tarjeta') {
            cardDetails.style.display = 'block';
            otherPaymentInfo.style.display = 'none';
        } else {
            cardDetails.style.display = 'none';
            otherPaymentInfo.style.display = 'block';
            otherPaymentInfo.innerHTML = `<p style="margin:0; font-size:0.9rem; color:#555;">Serás redirigido a la pasarela de pago de <strong>${e.target.value}</strong> para completar tu compra.</p>`;
        }
        checkoutError.textContent = '';
    });
});

// =============================================
// ========== VALIDACIÓN + FORMATO TARJETA =====
// =============================================
const cardNumber = document.getElementById('cardNumber');
const cardExpiry = document.getElementById('cardExpiry');
const cardCvv = document.getElementById('cardCvv');
const cardHolder = document.getElementById('cardHolder');

if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
}
if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        e.target.value = v;
    });
}
if (cardCvv) {
    cardCvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
}

function luhnValid(num) {
    const digits = num.replace(/\s/g, '');
    if (digits.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return sum % 10 === 0;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================
// ========== FORMULARIO DE PAGO ===============
// =============================================
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkoutError.textContent = '';

    const name = document.getElementById('buyerName').value.trim();
    const email = document.getElementById('buyerEmail').value.trim();
    const emailConfirm = document.getElementById('buyerEmailConfirm').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    if (!name) return showCheckoutError('Por favor, ingresa tu nombre.');
    if (!isValidEmail(email)) return showCheckoutError('El correo no es válido.');
    if (email !== emailConfirm) return showCheckoutError('Los correos electrónicos no coinciden.');

    if (paymentMethod === 'Tarjeta') {
        const num = cardNumber.value;
        const exp = cardExpiry.value;
        const cvv = cardCvv.value;
        const holder = cardHolder.value.trim();

        if (!luhnValid(num)) return showCheckoutError('El número de tarjeta no es válido.');
        if (!/^\d{2}\/\d{2}$/.test(exp)) return showCheckoutError('La fecha de vencimiento no es válida (MM/AA).');
        if (cvv.length < 3) return showCheckoutError('El CVV no es válido.');
        if (!holder) return showCheckoutError('Ingresa el nombre del titular.');
    }

    const btnSubmit = checkoutForm.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = 'Procesando...';
    btnSubmit.disabled = true;

    setTimeout(() => {
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        thanksMessage.innerHTML = `Tu pedido por <strong>$${total} USD</strong> ha sido registrado.<br>Método de pago: <strong>${paymentMethod}</strong>.<br>Te enviamos los detalles a <strong>${email}</strong>.`;
        thanksModal.classList.add('active');
        checkoutModal.classList.remove('active');

        cart = [];
        saveCart();
        updateCartUI();
        checkoutForm.reset();
        document.querySelector('input[value="Tarjeta"]').checked = true;
        cardDetails.style.display = 'block';
        otherPaymentInfo.style.display = 'none';
        checkoutError.textContent = '';
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }, 1800);
});

function showCheckoutError(msg) {
    checkoutError.textContent = msg;
    checkoutError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

closeThanks.addEventListener('click', closeThanksModal);
thanksModal.addEventListener('click', (e) => {
    if (e.target === thanksModal) closeThanksModal();
});
function closeThanksModal() {
    thanksModal.classList.remove('active');
    document.body.style.overflow = '';
}

// =============================================
// ========== FORMULARIO DE CONTACTO ===========
// =============================================
const contactForm = document.getElementById('contactForm');
const contactError = document.getElementById('contactError');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactError.textContent = '';

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const msg = document.getElementById('contactMessage').value.trim();

        if (!name) return (contactError.textContent = 'Ingresa tu nombre.');
        if (!isValidEmail(email)) return (contactError.textContent = 'Correo inválido.');
        if (!msg) return (contactError.textContent = 'Escribe un mensaje.');

        const phone = '34653263104';
        const text = encodeURIComponent(`Hola, soy ${name} (${email}).\n\nMensaje: ${msg}`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener');

        contactForm.reset();
        showToast('Abriendo WhatsApp...');
    });
}

// =============================================
// ========== TOAST (notificaciones) ===========
// =============================================
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// =============================================
// ========== BOTÓN VOLVER ARRIBA ==============
// =============================================
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
});
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =============================================
// ========== INICIALIZACIÓN ===================
// =============================================
updateCartUI();