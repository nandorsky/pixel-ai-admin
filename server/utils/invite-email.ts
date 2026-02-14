export function buildInviteTemplate(): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">

  <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">
    {{greeting}} to Pixel! 🎉
  </h1>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    We're opening up Pixel in small batches — and you're in this one.
    As one of our founding users, you're starting with
    <strong>{{credits}} credits</strong> on us.
    Click below to dive in.
  </p>

  <a href="https://app.getpixel.ai/easignup"
     style="display: inline-block; margin: 24px 0; padding: 12px 28px;
            background-color: #16a34a; color: #fff; text-decoration: none;
            border-radius: 8px; font-weight: 600; font-size: 16px;">
    Get Started
  </a>

  <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 8px; color: #111;">
    Want to share feedback?
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    I'm
    <a href="https://www.linkedin.com/in/nate-andorsky/" style="color: #16a34a; text-decoration: underline;">Nate Andorsky</a>
    — I've been helping launch Pixel and I'm the face behind these emails.
    We're building this alongside our early users, so your feedback matters a lot.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    Once you've had a chance to explore, I'd love to hear what's working and what's not —
    <a href="https://calendly.com/patent355/pixel-feedback" style="color: #16a34a; text-decoration: underline;">book a call with me</a>
    anytime.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">
    Talk soon,<br>
    Nate
  </p>

</div>`
}

export function replaceInvitePlaceholders(template: string, vars: {
  firstName: string
  credits: number
  referralCount: number
}): string {
  const greeting = vars.firstName ? `Hey ${vars.firstName}, welcome` : 'Welcome'
  const referralThanks = vars.referralCount > 0
    ? `<p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">Thanks for referring others to Pixel — we really appreciate you spreading the word!</p>`
    : ''

  return template
    .replace(/\{\{greeting\}\}/g, greeting)
    .replace(/\{\{firstName\}\}/g, vars.firstName)
    .replace(/\{\{credits\}\}/g, vars.credits.toLocaleString())
    .replace(/\{\{referralThanks\}\}/g, referralThanks)
    .replace(/\{\{referralCount\}\}/g, String(vars.referralCount))
}
