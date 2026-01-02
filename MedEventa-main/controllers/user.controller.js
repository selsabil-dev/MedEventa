// controllers/user.controller.js
const { getUsersByRole } = require('../models/user.model');

const getUsersByRoleController = (req, res) => {
    const { role } = req.params;

    // Safety check for role
    const allowedRoles = [
        'SUPER_ADMIN',
        'ORGANISATEUR',
        'COMMUNICANT',
        'PARTICIPANT',
        'MEMBRE_COMITE',
        'INVITE',
        'RESP_WORKSHOP'
    ];

    if (!allowedRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    getUsersByRole(role.toUpperCase(), (err, users) => {
        if (err) {
            console.error('Error fetching users by role:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(users);
    });
};

module.exports = {
    getUsersByRole: getUsersByRoleController
};
