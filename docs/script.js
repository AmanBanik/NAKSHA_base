document.addEventListener('DOMContentLoaded', () => {
    // Interactive Hurdle Cards
    const cards = document.querySelectorAll('.hurdle-card');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Toggle current card
            card.classList.toggle('active');
            
            // Optional: Close others (accordion style)
            // cards.forEach(c => {
            //     if (c !== card) c.classList.remove('active');
            // });
        });
    });

    // Smooth Scrolling for navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
