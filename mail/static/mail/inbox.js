document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Async request to send emails
  document.querySelector('#compose-form').addEventListener('submit', function(event) {

    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    const recipients = document.querySelector('#compose-recipients').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert('Email sent sucessfully!');
      }
    })
    .catch(error => {
      alert('An error occurred while sending the email');
    });

    load_mailbox('sent');

    event.preventDefault();
    return false;
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const element = document.createElement('div');

      if (mailbox === 'sent') {
        element.innerHTML = 
        `<div>
          <strong>To: ${email['recipients']}</strong> `;
      } else {
        element.innerHTML =
        `<div>
          <strong>${email['sender']}</strong> `;
      }

      element.innerHTML +=
          `${email['subject']}
        </div>
        <div class="text-muted">
          ${email['timestamp']}
        </div>`

      element.classList.add('email-item');

      if (email['read'] === false) {
        element.style.backgroundColor = 'white';
      } else {
        element.style.backgroundColor = 'lightgray';
      }

      element.addEventListener('click', () => load_email(email['id']));

      document.querySelector('#emails-view').append(element);
      
    })
  })
}