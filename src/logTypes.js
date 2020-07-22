const sev = { success: 'success', error: 'error', warning: 'warning' };
const logTypes = {
  s: {
    name: 'Success Login',
    icon: 'icon-budicon-448',
    severity: sev.success,
    level: 1
  },
  ssa: {
    name: 'Success Silent Auth',
    icon: 'icon-budicon-448',
    severity: sev.success,
    level: 1
  },
  fsa: {
    name: 'Failed Silent Auth',
    icon: 'icon-budicon-448',
    severity: sev.error,
    level: 3
  },
  seacft: {
    name: 'Success Exchange',
    description: 'Authorization Code for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  feacft: {
    name: 'Failed Exchange',
    description: 'Authorization Code for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  seccft: {
    name: 'Success Exchange',
    description: 'Client Credentials for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  feccft: {
    name: 'Failed Exchange',
    description: 'Client Credentials for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  sepft: {
    name: 'Success Exchange',
    description: 'Password for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  fepft: {
    name: 'Failed Exchange',
    description: 'Password for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  sertft: {
    name: 'Success Exchange',
    description: 'Refresh Token for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  fertft: {
    name: 'Failed Exchange',
    description: 'Refresh Token for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  ferrt: {
    name: 'Failed Exchange',
    description: 'Reused Refresh Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  seoobft: {
    name: 'Success Exchange',
    description: 'Password and OOB Challenge for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  feoobft: {
    name: 'Failed Exchange',
    description: 'Password and OOB Challenge for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  seotpft: {
    name: 'Success Exchange',
    description: 'Password and OTP Challenge for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  feotpft: {
    name: 'Failed Exchange',
    description: 'Password and OTP Challenge for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  sercft: {
    name: 'Success Exchange',
    description: 'Password and MFA Recovery code for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  fercft: {
    name: 'Failed Exchange',
    description: 'Password and MFA Recovery code for Access Token',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  f: {
    name: 'Failed Login',
    icon: 'icon-budicon-448',
    severity: sev.error,
    level: 3
  },
  w: {
    name: 'Warning',
    icon: 'icon-budicon-354',
    severity: sev.warning,
    level: 2
  },
  depnote: {
    name: 'Deprecation Notice',
    icon: 'icon-budicon-354',
    severity: sev.warning,
    level: 2
  },
  du: {
    name: 'Deleted User',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  fu: {
    name: 'Failed Login (invalid email/username)',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  fp: {
    name: 'Failed Login (wrong password)',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  fc: {
    name: 'Failed by Connector',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 3
  },
  fco: {
    name: 'Failed by CORS',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 3
  },
  con: {
    name: 'Connector Online',
    icon: 'icon-budicon-143',
    severity: sev.success,
    level: 1
  },
  coff: {
    name: 'Connector Offline',
    icon: 'icon-budicon-143',
    severity: sev.error,
    level: 3
  },
  fcpro: {
    name: 'Failed Connector Provisioning',
    icon: 'icon-budicon-143',
    severity: sev.error,
    level: 4
  },
  ss: {
    name: 'Success Signup',
    icon: 'icon-budicon-314',
    severity: sev.success,
    level: 1
  },
  fs: {
    name: 'Failed Signup',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  cs: {
    name: 'Code Sent',
    icon: 'icon-budicon-243',
    severity: sev.success,
    level: 1
  },
  cls: {
    name: 'Code/Link Sent',
    icon: 'icon-budicon-781',
    severity: sev.success,
    level: 1
  },
  sv: {
    name: 'Success Verification Email',
    icon: 'icon-budicon-781',
    severity: sev.success,
    level: 1
  },
  fv: {
    name: 'Failed Verification Email',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  scp: {
    name: 'Success Change Password',
    icon: 'icon-budicon-280',
    severity: sev.success,
    level: 1
  },
  fcp: {
    name: 'Failed Change Password',
    icon: 'icon-budicon-266',
    severity: sev.error,
    level: 3
  },
  scph: {
    name: 'Success Post Change Password Hook',
    icon: 'icon-budicon-280',
    severity: sev.success,
    level: 1
  },
  fcph: {
    name: 'Failed Post Change Password Hook',
    icon: 'icon-budicon-266',
    severity: sev.error,
    level: 3
  },
  sce: {
    name: 'Success Change Email',
    icon: 'icon-budicon-266',
    severity: sev.success,
    level: 1
  },
  fce: {
    name: 'Failed Change Email',
    icon: 'icon-budicon-266',
    severity: sev.error,
    level: 3
  },
  scu: {
    name: 'Success Change Username',
    icon: 'icon-budicon-266',
    severity: sev.success,
    level: 1
  },
  fcu: {
    name: 'Failed Change Username',
    icon: 'icon-budicon-266',
    severity: sev.error,
    level: 3
  },
  scpn: {
    name: 'Success Change Phone Number',
    icon: 'icon-budicon-266',
    severity: sev.success,
    level: 1
  },
  fcpn: {
    name: 'Failed Change Phone Number',
    icon: 'icon-budicon-266',
    severity: sev.error,
    level: 3
  },
  svr: {
    name: 'Success Verification Email Request',
    icon: 'icon-budicon-781',
    severity: sev.success,
    level: 1
  },
  fvr: {
    name: 'Failed Verification Email Request',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  scpr: {
    name: 'Success Change Password Request',
    icon: 'icon-budicon-280',
    severity: sev.success,
    level: 1
  },
  fcpr: {
    name: 'Failed Change Password Request',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  fn: {
    name: 'Failed Sending Notification',
    icon: 'icon-budicon-782',
    severity: sev.error,
    level: 3
  },
  sapi: {
    name: 'API Operation',
    icon: 'icon-budicon-546',
    severity: sev.success,
    level: 1,
    category: 'api'
  },
  fapi: {
    name: 'Failed API Operation',
    icon: 'icon-budicon-546',
    severity: sev.error,
    level: 3,
    category: 'api'
  },
  limit_wc: {
    name: 'Blocked Account',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 4
  },
  limit_mu: {
    name: 'Blocked IP Address',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 4
  },
  limit_ui: {
    name: 'Too Many Calls to /userinfo',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 4
  },
  api_limit: {
    name: 'Rate Limit On API',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 4
  },
  limit_delegation: {
    name: 'Too Many Calls to /delegation',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 4
  },
  sdu: {
    name: 'Successful User Deletion',
    icon: 'icon-budicon-312',
    severity: sev.success,
    level: 1
  },
  fdu: {
    name: 'Failed User Deletion',
    icon: 'icon-budicon-311',
    severity: sev.error,
    level: 3
  },
  admin_update_launch: {
    name: 'Auth0 Update Launched',
    icon: 'icon-budicon-774',
    severity: sev.success,
    level: 1
  },
  sys_os_update_start: {
    name: 'Auth0 OS Update Started',
    icon: 'icon-budicon-661',
    severity: sev.success,
    level: 1
  },
  sys_os_update_end: {
    name: 'Auth0 OS Update Ended',
    icon: 'icon-budicon-661',
    severity: sev.success,
    level: 1
  },
  sys_update_start: {
    name: 'Auth0 Update Started',
    icon: 'icon-budicon-661',
    severity: sev.success,
    level: 1
  },
  sys_update_end: {
    name: 'Auth0 Update Ended',
    icon: 'icon-budicon-661',
    severity: sev.success,
    level: 1
  },
  slo: {
    name: 'Success Logout',
    icon: 'icon-budicon-449',
    severity: sev.success,
    level: 1
  },
  flo: {
    name: 'Failed Logout',
    icon: 'icon-budicon-449',
    severity: sev.error,
    level: 3
  },
  sd: {
    name: 'Success Delegation',
    icon: 'icon-budicon-456',
    severity: sev.success,
    level: 1
  },
  fd: {
    name: 'Failed Delegation',
    icon: 'icon-budicon-456',
    severity: sev.error,
    level: 3
  },
  gd_unenroll: {
    name: 'Unenroll device account',
    icon: 'icon-budicon-298',
    severity: sev.success,
    level: 1
  },
  gd_update_device_account: {
    name: 'Update device account',
    icon: 'icon-budicon-257',
    severity: sev.success,
    level: 1
  },
  gd_module_switch: {
    name: 'Module switch',
    icon: 'icon-budicon-329',
    severity: sev.success,
    level: 1
  },
  gd_tenant_update: {
    name: 'Guardian tenant update',
    icon: 'icon-budicon-170',
    severity: sev.success,
    level: 1
  },
  gd_start_auth: {
    name: 'Second factor started',
    icon: 'icon-budicon-285',
    severity: sev.success,
    level: 1
  },
  gd_start_enroll: {
    name: 'Enroll started',
    icon: 'icon-budicon-299',
    severity: sev.success,
    level: 1
  },
  gd_start_enroll_failed: {
    name: 'MFA Enrollment start failed',
    icon: 'icon-budicon-299',
    severity: sev.error,
    level: 3
  },
  gd_user_delete: {
    name: 'User delete',
    icon: 'icon-budicon-298',
    severity: sev.success,
    level: 1
  },
  gd_auth_succeed: {
    name: 'OTP Auth suceed',
    icon: 'icon-budicon-mfa-login-succeed',
    severity: sev.success,
    level: 1
  },
  gd_auth_failed: {
    name: 'OTP Auth failed',
    icon: 'icon-budicon-mfa-login-failed',
    severity: sev.error,
    level: 3
  },
  gd_send_pn: {
    name: 'Push notification sent',
    icon: 'icon-budicon-mfa-send-pn',
    severity: sev.success,
    level: 1
  },
  gd_send_pn_failure: {
    name: 'Error sending MFA Push Notification',
    icon: 'icon-budicon-mfa-send-pn',
    severity: sev.error,
    level: 3
  },
  gd_auth_rejected: {
    name: 'OTP Auth rejected',
    icon: 'icon-budicon-mfa-login-failed',
    severity: sev.error,
    level: 3
  },
  gd_recovery_succeed: {
    name: 'Recovery succeed',
    icon: 'icon-budicon-mfa-recovery-succeed',
    severity: sev.success,
    level: 1
  },
  gd_recovery_failed: {
    name: 'Recovery failed',
    icon: 'icon-budicon-mfa-recovery-failed',
    severity: sev.error,
    level: 3
  },
  gd_send_sms: {
    name: 'SMS Sent',
    icon: 'icon-budicon-799',
    severity: sev.success,
    level: 1
  },
  gd_send_sms_failure: {
    name: 'Error sending MFA SMS',
    icon: 'icon-budicon-799',
    severity: sev.error,
    level: 3
  },
  gd_otp_rate_limit_exceed: {
    name: 'Too many failures',
    icon: 'icon-budicon-435',
    severity: sev.warning,
    level: 2
  },
  gd_recovery_rate_limit_exceed: {
    name: 'Too many failures',
    icon: 'icon-budicon-435',
    severity: sev.warning,
    level: 2
  },
  gd_enrollment_complete: {
    name: 'Guardian enrollment complete',
    icon: 'icon-budicon-299',
    severity: sev.success,
    level: 1
  },
  gd_send_voice: {
    name: 'Made voice call',
    icon: 'icon-budicon-799',
    severity: sev.success,
    level: 1
  },
  gd_send_voice_failure: {
    name: 'Error making MFA voice call',
    icon: 'icon-budicon-799',
    severity: sev.error,
    level: 3
  },
  fui: {
    name: 'Users import',
    icon: 'icon-budicon-299',
    severity: sev.warning,
    level: 2
  },
  sui: {
    name: 'Users import',
    icon: 'icon-budicon-299',
    severity: sev.success,
    level: 1
  },
  pwd_leak: {
    name: 'Breached password',
    icon: 'icon-budicon-313',
    severity: sev.error,
    level: 3
  },
  fcoa: {
    name: 'Failed cross origin authentication',
    icon: 'icon-budicon-448',
    severity: sev.error,
    level: 3
  },
  scoa: {
    name: 'Success cross origin authentication',
    icon: 'icon-budicon-448',
    severity: sev.success,
    level: 1
  },
  ublkdu: {
    name: 'Account unblocked',
    icon: 'icon-budicon-313',
    severity: sev.success,
    level: 1
  },
  sens: {
    name: 'Success Exchange',
    icon: 'icon-budicon-448',
    severity: sev.success,
    level: 1
  },
  fens: {
    name: 'Failed Exchange',
    icon: 'icon-budicon-448',
    severity: sev.error,
    level: 3
  }
};

module.exports = logTypes;
module.exports.get = function(type) {
  return (logTypes[type] && logTypes[type].name) || 'Unknown Log Type: ' + type;
};
