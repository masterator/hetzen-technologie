const WHATSAPP_NUMBER = "27813004634";
const WHATSAPP_MESSAGE = "Hello Hetzen Technologies. I would like to discuss a project for my business.";

document.getElementById('year').textContent = new Date().getFullYear();

const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

if (WHATSAPP_NUMBER) {
  document.querySelectorAll('a[href="#contact"]').forEach(a => {
    if (a.classList.contains('btn-primary') && a.textContent.toLowerCase().includes('project')) {
      // Keep primary CTA focused on the enquiry form.
    }
  });
}

document.getElementById('contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`Hetzen Technologies Project Enquiry — ${form.get('business')}`);
  const body = encodeURIComponent(
`Name: ${form.get('name')}\nBusiness: ${form.get('business')}\nService: ${form.get('service')}\n\nProblem / requirement:\n${form.get('message')}`
  );
  window.location.href = `mailto:midimetjasilas93@gmail.com?subject=${subject}&body=${body}`;
});


// WhatsApp contact link
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener';
});
