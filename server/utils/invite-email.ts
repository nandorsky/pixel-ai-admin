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
    Run Your First Campaign
  </a>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    If you run into any issues, reach out to us at
    <a href="mailto:support@getpixel.ai" style="color: #16a34a; text-decoration: underline;">support@getpixel.ai</a>.
  </p>

  <table style="margin-top: 32px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align: middle; padding-right: 14px;">
        <img src="https://media.licdn.com/dms/image/v2/D4D03AQFyOihrLRzjGA/profile-displayphoto-scale_400_400/B4DZqhjozHKEAg-/0/1763647069405?e=1772668800&v=beta&t=-UY_oz6W87R01xSvPMh0RMHxo3qVEqs_in8cyKCohqQ"
             alt="Gil Allouche"
             width="48" height="48"
             style="border-radius: 50%; display: block;" />
      </td>
      <td style="vertical-align: middle;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">Gil Allouche</p>
        <p style="margin: 2px 0 0; font-size: 14px; color: #666;">Founder, Pixel</p>
      </td>
    </tr>
  </table>

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
