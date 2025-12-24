// middleware/permissions.js
const permissions = {
  SUPER_ADMIN: [
    'create_event', 'delete_user', 'view_all', 'manage_evaluations',
    'decide_submission',
    'view_submissions',
    'create_workshop',
    'edit_workshop',
    'delete_workshop',
    'view_workshops',
    'manage_workshop_inscriptions',
    'manage_workshop_supports',

    // ✅ ajout attestations
    'generate_attestation',
    'view_attestations',
    'view_stats'
  ],

  ORGANISATEUR: [
    'create_event', 'edit_event', 'manage_inscriptions', 'manage_evaluations',
    'decide_submission',
    'view_submissions',
    'create_workshop',
    'edit_workshop',
    'delete_workshop',
    'view_workshops',
    'manage_workshop_inscriptions',
    'manage_workshop_supports',

    // ✅ ajout attestations
    'generate_attestation',
    'view_attestations',
    'view_stats'
  ],

  COMMUNICANT: [
    'submit_communication',
    'create_submission',
    'update_submission',
    'delete_submission',
    'withdraw_submission', //سحب الطلب
    'view_own_communications',
    'register_event',
    'view_workshops',
    'register_workshop'
  ],

  PARTICIPANT: [
    'register_event',
    'view_public_info',
    'view_workshops',
    'register_workshop'
  ],

  MEMBRE_COMITE: [
    'evaluate_communications', 'view_comite',
    'decide_submission',
    'view_submissions', 
    'view_workshops'
  ],

  INVITE: [
    'view_event_details',
    'register_event',

    'view_workshops'
  ],

  RESP_WORKSHOP: [
  'view_workshops',
  'create_workshop',         
  'edit_workshop',
  'delete_workshop',         
  'manage_workshop_inscriptions',
  'manage_workshop_supports'
],
  SUPER_ADMIN: ['create_event', 'delete_user', 'view_all', 'manage_evaluations', 'manage_program','manage_event',],
  ORGANISATEUR: ['create_event', 'edit_event', 'manage_inscriptions', 'manage_evaluations', 'manage_program','manage_event',],
  COMMUNICANT: ['submit_communication', 'view_own_communications', 'register_event'],
  PARTICIPANT: ['register_event', 'view_public_info'],
  MEMBRE_COMITE: ['evaluate_communications', 'view_comite'],
  INVITE: ['view_event_details', 'register_event'],
  RESP_WORKSHOP: ['manage_workshop'],
};

const hasPermission = (role, permission) => {
  return permissions[role] && permissions[role].includes(permission);
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || !hasPermission(req.user.role, permission)) {
    return res.status(403).json({ message: 'Permission refusée' });
  }
  next();
};

module.exports = { permissions, hasPermission, requirePermission };
