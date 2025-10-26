document.addEventListener('DOMContentLoaded', () => {
  const requestBtn = document.getElementById('request-otp');
  const verifyBtn = document.getElementById('verify-otp');
  const contactInput = document.getElementById('contact');
  const otpInput = document.getElementById('otp');
  const requestResult = document.getElementById('request-result');
  const verifyResult = document.getElementById('verify-result');

  requestBtn.addEventListener('click', async () => {
    const contact = contactInput.value.trim();
    if (!contact) {
      requestResult.textContent = 'Please enter an email or phone.';
      return;
    }
    requestResult.textContent = 'Requesting OTP...';
    try {
      const res = await fetch('/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact })
      });
      const body = await res.json();
      if (res.ok) {
        // For demo we show the OTP; in production this would be emailed/sent by SMS
        requestResult.innerHTML = `OTP sent (demo code): <strong>${body.otp}</strong>`;
      } else {
        requestResult.textContent = body.error || 'Failed to request OTP';
      }
    } catch (err) {
      requestResult.textContent = 'Network error';
    }
  });

  verifyBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    if (!otp) {
      verifyResult.textContent = 'Enter the OTP you received.';
      return;
    }
    verifyResult.textContent = 'Verifying...';
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const body = await res.json();
      if (res.ok) {
        verifyResult.innerHTML = 'Login successful — redirecting...';
        setTimeout(() => window.location.href = '/', 800);
      } else {
        verifyResult.textContent = body.error || 'OTP verification failed';
      }
    } catch (err) {
      verifyResult.textContent = 'Network error';
    }
  });
});
