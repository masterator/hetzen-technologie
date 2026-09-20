(function () {
  const menuBtn = document.getElementById('menuBtn');
  const navMenu = document.getElementById('navMenu');
  const quoteForm = document.getElementById('quoteForm');
  const serviceSelect = document.getElementById('serviceSelect');
  const quoteSection = document.getElementById('quote');

  // Mobile navigation
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', function () {
      const open = navMenu.classList.toggle('open');
      menuBtn.textContent = open ? '✕' : '☰';
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        menuBtn.textContent = '☰';
        menuBtn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // Service buttons: jump to the quote form and pre-select the service.
  document.querySelectorAll('.quote-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      const service = link.getAttribute('data-service');
      if (service && serviceSelect) serviceSelect.value = service;
      if (quoteSection) quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (serviceSelect) setTimeout(function () { serviceSelect.focus(); }, 500);
    });
  });

  // Homepage Request a Quote button.
  document.querySelectorAll('a[href="#quote"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (link.classList.contains('quote-link')) return;
      event.preventDefault();
      if (quoteSection) quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Quote form -> WhatsApp message.
  if (quoteForm) {
    quoteForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = new FormData(quoteForm);
      const name = String(formData.get('name') || '').trim();
      const business = String(formData.get('business') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const service = String(formData.get('service') || '').trim();
      const budget = String(formData.get('budget') || 'Not specified').trim();
      const timeline = String(formData.get('timeline') || 'Not specified').trim();
      const details = String(formData.get('details') || '').trim();

      const message = [
        'Hello Hetzen Technologies,',
        '',
        'I would like to request a quote.',
        '',
        '*Customer Details*',
        'Name: ' + name,
        'Business: ' + (business || 'Not provided'),
        'Email: ' + email,
        'Phone/WhatsApp: ' + phone,
        '',
        '*Project Details*',
        'Service: ' + service,
        'Budget: ' + budget,
        'Timeline: ' + timeline,
        'Details: ' + details
      ].join('\n');

      const whatsappUrl = 'https://wa.me/27813004634?text=' + encodeURIComponent(message);
      window.open(whatsappUrl, '_blank', 'noopener');
    });
  }

  // Current year in footer.
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
