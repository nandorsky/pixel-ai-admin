export function buildFollowUpTemplate(): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    {{greeting}}
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    Just wanted to make sure this didn't get buried in your inbox — we sent you early access to Pixel with 1,750 free credits to play around with.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    Your invite expires in 3 days though, and we'd hate for you to lose those credits. After that, your spot opens up to the next person on the waitlist.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    No pressure — but if you've been meaning to check it out, now's the time!
  </p>

  <a href="https://app.getpixel.ai/easignup"
     style="display: inline-block; margin: 24px 0; padding: 12px 28px;
            background-color: #16a34a; color: #fff; text-decoration: none;
            border-radius: 8px; font-weight: 600; font-size: 16px;">
    Run Your First Campaign
  </a>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    Questions? Just reply here or reach out at
    <a href="mailto:support@getpixel.ai" style="color: #16a34a; text-decoration: underline;">support@getpixel.ai</a>.
    Happy to help.
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

export function replaceFollowUpPlaceholders(template: string, vars: {
  firstName: string
}): string {
  const greeting = vars.firstName ? `Hey ${vars.firstName},` : 'Hey there,'
  return template.replace(/\{\{greeting\}\}/g, greeting)
}
