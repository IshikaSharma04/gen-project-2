document.addEventListener('DOMContentLoaded', () => {

    /* ── Animate all progress bars on load ── */
    document.querySelectorAll('[data-width]').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.width; }, 300);
    });

    /* ── Join Now button ── */
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            alert('Joining your live class…\n\nSystem Design: Microservices & APIs\nInstructor: Anshuman Singh\nToday, 8:00 PM IST');
        });
    }

    /* ── Active nav switching ── */
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            // close sidebar on mobile after click
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    /* ── Mobile sidebar toggle ── */
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar    = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // close sidebar when clicking outside on mobile
        document.addEventListener('click', e => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    /* ── Notification button ── */
    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert('🔔 You have 3 new notifications:\n\n• Live class starts in 30 minutes\n• Assignment deadline tomorrow\n• New feedback from your mentor');
        });
    }

    /* ── Module card click ── */
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h4').textContent;
            alert('📚 Opening: ' + title);
        });
    });

});