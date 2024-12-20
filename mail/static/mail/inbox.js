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
      load_mailbox('sent');
    })
    .catch(error => {
      alert('An error occurred while sending the email');
    });

    event.preventDefault();
    return false;
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const element = document.createElement('div');

      if (mailbox === 'sent') {
        element.innerHTML = `
          <div class="email-row">
            <div class="email-info">
              <strong>To: ${email.recipients}</strong> ${email.subject}
            </div>
            <div class="email-timestamp text-muted">
              ${email.timestamp}
            </div>
          </div>`;
      } else {
        element.innerHTML += `
          <div class="email-row">
            <div class="email-info">
              <strong>${email.sender}</strong> ${email.subject}
            </div>
            <div class="email-timestamp text-muted">
              ${email.timestamp}
            </div>
          </div>`;
      }

      if (email.read === true && mailbox === 'inbox') {
        element.classList.add('email-row-read');
        //element.className = 'email-row-read';
      }
     
      element.addEventListener('click', () => load_email(email.id, mailbox));

      document.querySelector('#emails-view').append(element);
    });
  });
}


function load_email(email_id, mailbox) {
  
  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    const element = document.querySelector('#email-view');

    // Populate email view
    element.innerHTML = 
     `<p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <hr>
      <p>${email.body}</p>
     `;

    // Change to read
    if(!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }

    // Create a container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'buttonContainer';

    // Archive/Unarchive logic
    if (mailbox !== 'sent') {
      const archive_btn = document.createElement('button');
      archive_btn.innerHTML = email.archived ? "Unarchive" : "Archive";
      archive_btn.className = email.archived ? "btn btn-sm btn-outline-danger" : "btn btn-sm btn-outline-success";

      archive_btn.addEventListener('click', () => toogle_archive(email.id, email.archived));

      buttonContainer.appendChild(archive_btn);
    }
    
    // Reply
    if (mailbox !== 'sent') {
      const reply_btn = document.createElement('button');
      reply_btn.innerHTML = 'Reply';
      reply_btn.className = 'btn btn-sm btn-outline-primary';

      reply_btn.addEventListener('click', () => reply(email));

      buttonContainer.appendChild(reply_btn);
    }

    // Append the button container to the email view
    element.appendChild(buttonContainer);
    

  });

}


function toogle_archive(id, archived) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  })
  .then(() => {
    load_mailbox('inbox');
  });
}


function reply(email) {
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill the composition fields
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;

  // Focus on body field
  document.querySelector('#compose-body').focus();

}
