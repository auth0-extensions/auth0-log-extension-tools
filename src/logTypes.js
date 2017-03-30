const logTypes = {
  s: {
    name: 'Success Login',
    icon: 'icon-budicon-448',
    level: 1 // Info
  },
  ssa: {
    name: 'Success Silent Auth',
    icon: 'icon-budicon-448',
    level: 1 // Info
  },
  fsa: {
    name: 'Failed Silent Auth',
    icon: 'icon-budicon-448',
    level: 3 // Error
  },
  seacft: {
    name: 'Success Exchange',
    description: 'Authorization Code for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  feacft: {
    name: 'Failed Exchange',
    description: 'Authorization Code for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  seccft: {
    name: 'Success Exchange',
    description: 'Client Credentials for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  feccft: {
    name: 'Failed Exchange',
    description: 'Client Credentials for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  sepft: {
    name: 'Success Exchange',
    description: 'Password for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  fepft: {
    name: 'Failed Exchange',
    description: 'Password for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  sertft: {
    name: 'Success Exchange',
    description: 'Refresh Token for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  fertft: {
    name: 'Failed Exchange',
    description: 'Refresh Token for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  seoobft: {
    name: 'Success Exchange',
    description: 'Password and OOB Challenge for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  feoobft: {
    name: 'Failed Exchange',
    description: 'Password and OOB Challenge for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  seotpft: {
    name: 'Success Exchange',
    description: 'Password and OTP Challenge for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  feotpft: {
    name: 'Failed Exchange',
    description: 'Password and OTP Challenge for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  sercft: {
    name: 'Success Exchange',
    description: 'Password and MFA Recovery code for Access Token',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  fercft: {
    name: 'Failed Exchange',
    description: 'Password and MFA Recovery code for Access Token',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  f: {
    name: 'Failed Login',
    icon: 'icon-budicon-448',
    level: 3 // Error
  },
  w: {
    name: 'Warning',
    icon: 'icon-budicon-354',
    level: 2 // Warning
  },
  du: {
    name: 'Deleted User',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  fu: {
    name: 'Failed Login (invalid email/username)',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  fp: {
    name: 'Failed Login (wrong password)',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  fc: {
    name: 'Failed by Connector',
    icon: 'icon-budicon-313',
    level: 3 // Error
  },
  fco: {
    name: 'Failed by CORS',
    icon: 'icon-budicon-313',
    level: 3 // Error
  },
  con: {
    name: 'Connector Online',
    icon: 'icon-budicon-143',
    level: 1 // Info
  },
  coff: {
    name: 'Connector Offline',
    icon: 'icon-budicon-143',
    level: 3 // Error
  },
  fcpro: {
    name: 'Failed Connector Provisioning',
    icon: 'icon-budicon-143',
    level: 4 // Error
  },
  ss: {
    name: 'Success Signup',
    icon: 'icon-budicon-314',
    level: 1 // Info
  },
  fs: {
    name: 'Failed Signup',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  cs: {
    name: 'Code Sent',
    icon: 'icon-budicon-243',
    level: 1 // Info
  },
  cls: {
    name: 'Code/Link Sent',
    icon: 'icon-budicon-781',
    level: 1 // Info
  },
  sv: {
    name: 'Success Verification Email',
    icon: 'icon-budicon-781',
    level: 1 // Info
  },
  fv: {
    name: 'Failed Verification Email',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  scp: {
    name: 'Success Change Password',
    icon: 'icon-budicon-280',
    level: 1 // Info
  },
  fcp: {
    name: 'Failed Change Password',
    icon: 'icon-budicon-266',
    level: 3 // Error
  },
  sce: {
    name: 'Success Change Email',
    icon: 'icon-budicon-266',
    level: 1 // Info
  },
  fce: {
    name: 'Failed Change Email',
    icon: 'icon-budicon-266',
    level: 3 // Error
  },
  scu: {
    name: 'Success Change Username',
    icon: 'icon-budicon-266',
    level: 1 // Info
  },
  fcu: {
    name: 'Failed Change Username',
    icon: 'icon-budicon-266',
    level: 3 // Error
  },
  scpn: {
    name: 'Success Change Phone Number',
    icon: 'icon-budicon-266',
    level: 1 // Info
  },
  fcpn: {
    name: 'Failed Change Phone Number',
    icon: 'icon-budicon-266',
    level: 3 // Error
  },
  svr: {
    name: 'Success Verification Email Request',
    icon: 'icon-budicon-781',
    level: 0 // Info
  },
  fvr: {
    name: 'Failed Verification Email Request',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  scpr: {
    name: 'Success Change Password Request',
    icon: 'icon-budicon-280',
    level: 1 // Info
  },
  fcpr: {
    name: 'Failed Change Password Request',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  fn: {
    name: 'Failed Sending Notification',
    icon: 'icon-budicon-782',
    level: 3 // Error
  },
  sapi: {
    name: 'API Operation',
    icon: 'icon-budicon-546',
    level: 1 // Info
  },
  fapi: {
    name: 'Failed API Operation',
    icon: 'icon-budicon-546',
    level: 3 // Error
  },
  limit_wc: {
    name: 'Blocked Account',
    icon: 'icon-budicon-313',
    level: 4 // Error
  },
  limit_mu: {
    name: 'Blocked IP Address',
    icon: 'icon-budicon-313',
    level: 4 // Error
  },
  limit_ui: {
    name: 'Too Many Calls to /userinfo',
    icon: 'icon-budicon-313',
    level: 4 // Error
  },
  api_limit: {
    name: 'Rate Limit On API',
    icon: 'icon-budicon-313',
    level: 4 // Error
  },
  limit_delegation: {
    name: 'Too Many Calls to /delegation',
    icon: 'icon-budicon-313',
    level: 4 // Error
  },
  sdu: {
    name: 'Successful User Deletion',
    icon: 'icon-budicon-312',
    level: 1 // Info
  },
  fdu: {
    name: 'Failed User Deletion',
    icon: 'icon-budicon-311',
    level: 3 // Error
  },
  slo: {
    name: 'Success Logout',
    icon: 'icon-budicon-449',
    level: 1 // Info
  },
  flo: {
    name: 'Failed Logout',
    icon: 'icon-budicon-449',
    level: 3 // Error
  },
  sd: {
    name: 'Success Delegation',
    icon: 'icon-budicon-456',
    level: 1 // Info
  },
  fd: {
    name: 'Failed Delegation',
    icon: 'icon-budicon-456',
    level: 3 // Error
  },
  gd_unenroll: {
    name: 'Unenroll device account',
    icon: 'icon-budicon-298',
    level: 1 // Info
  },
  gd_update_device_account: {
    name: 'Update device account',
    icon: 'icon-budicon-257',
    level: 1 // Info
  },
  gd_module_switch: {
    name: 'Module switch',
    icon: 'icon-budicon-329',
    level: 1 // Info
  },
  gd_tenant_update: {
    name: 'Guardian tenant update',
    icon: 'icon-budicon-170',
    level: 1 // Info
  },
  gd_start_auth: {
    name: 'Second factor started',
    icon: 'icon-budicon-285',
    level: 1 // Info
  },
  gd_start_enroll: {
    name: 'Enroll started',
    icon: 'icon-budicon-299',
    level: 1 // Info
  },
  gd_user_delete: {
    name: 'User delete',
    icon: 'icon-budicon-298',
    level: 1 // Info
  },
  gd_auth_succeed: {
    name: 'OTP Auth suceed',
    icon: 'icon-budicon-mfa-login-succeed',
    level: 1 // Info
  },
  gd_auth_failed: {
    name: 'OTP Auth failed',
    icon: 'icon-budicon-mfa-login-failed',
    level: 3 // Error
  },
  gd_send_pn: {
    name: 'Push notification sent',
    icon: 'icon-budicon-mfa-send-pn',
    level: 1 // Info
  },
  gd_auth_rejected: {
    name: 'OTP Auth rejected',
    icon: 'icon-budicon-mfa-login-failed',
    level: 3 // Error
  },
  gd_recovery_succeed: {
    name: 'Recovery succeed',
    icon: 'icon-budicon-mfa-recovery-succeed',
    level: 1 // Info
  },
  gd_recovery_failed: {
    name: 'Recovery failed',
    icon: 'icon-budicon-mfa-recovery-failed',
    level: 3 // Error
  },
  gd_send_sms: {
    name: 'SMS Sent',
    icon: 'icon-budicon-799',
    level: 1 // Info
  },
  gd_otp_rate_limit_exceed: {
    name: 'Too many failures',
    icon: 'icon-budicon-435',
    level: 2 // Warning
  },
  gd_recovery_rate_limit_exceed: {
    name: 'Too many failures',
    icon: 'icon-budicon-435',
    level: 2 // Warning
  },
  fui: {
    name: 'Users import',
    icon: 'icon-budicon-299',
    level: 2 // Warning
  },
  sui: {
    name: 'Users import',
    icon: 'icon-budicon-299',
    level: 1 // Info
  },
  pwd_leak: {
    name: 'Breached password',
    icon: 'icon-budicon-313',
    level: 3 // Error
  }
};

module.exports = logTypes;
module.exports.get = function(type) {
  return (logTypes[type] && logTypes[type].name) || 'Unknown Log Type: ' + type;
};
