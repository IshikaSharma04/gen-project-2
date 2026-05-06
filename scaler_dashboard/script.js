document.addEventListener('DOMContentLoaded', () => {

    // ── Join Now button alert ──
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            alert('🚀 Connecting you to the live class session!\n\nSystem Design: Microservices & APIs\nInstructor: Anshuman Singh\nTime: Today, 8:00 PM IST');
        });
    }

    // ── Active nav link highlight ──
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // ── Notification button ──
    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert('🔔 You have 3 new notifications:\n\n• Live class starts in 30 minutes\n• Assignment deadline tomorrow\n• New feedback from your mentor');
        });
    }

    // ── Module card hover animation ──
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h4').textContent;
            alert(`📚 Opening module: ${title}`);
        });
    });

    // ── Animate progress bars on load ──
    const fills = document.querySelectorAll('.progress-bar-fill, .progress-fill');
    fills.forEach(fill => {
        const targetWidth = fill.style.width;
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = targetWidth; }, 200);
    });

});