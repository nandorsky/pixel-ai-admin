export function buildCampaignNudgeTemplate(): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">

  <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">
    {{greeting}}
  </h1>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 16px;">
    I noticed you started creating a campaign but haven't launched one yet.
    I'd love to know what's holding you back — is there anything we can help with?
  </p>

  <table style="margin-top: 32px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align: middle; padding-right: 14px;">
        <img src="https://media.licdn.com/dms/image/v2/C4E03AQHvJiQwKByh8w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1517723543063?e=1773273600&v=beta&t=4Wv_EYOqF_QuMpOTNV0iDdphrPLrumFb2tPutWqhMU0"
             alt="Nate Andorsky"
             width="48" height="48"
             style="border-radius: 50%; display: block;" />
      </td>
      <td style="vertical-align: middle;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111;">Nate Andorsky</p>
        <p style="margin: 2px 0 0; font-size: 14px; color: #666;">Customer Experience, Pixel</p>
      </td>
    </tr>
  </table>

</div>`
}

export function replaceCampaignNudgePlaceholders(template: string, vars: {
  firstName: string
}): string {
  const greeting = vars.firstName ? `Hey ${vars.firstName},` : 'Hey there,'

  return template
    .replace(/\{\{greeting\}\}/g, greeting)
}
