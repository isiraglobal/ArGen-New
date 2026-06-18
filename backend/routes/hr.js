const express = require('express');
const router = express.Router();
const { protect, authorize, isApproved } = require('../middleware/auth');
const { db } = require('../utils/supabase');

// GET /api/hr/employees — list all employees in company (HR / teamadmin)
router.get('/employees', protect, isApproved, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    if (!req.user.companyId) return res.json({ employees: [] });

    const snap = await db.collection('users')
      .where('companyId', '==', req.user.companyId)
      .get();

    const employees = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        email: d.email,
        phone: d.phone || '',
        role: d.role,
        jobRole: d.jobRole || '',
        department: d.department || '',
        departmentId: d.departmentId || '',
        employeeId: d.employeeId || '',
        employmentType: d.employmentType || '',
        manager: d.manager || '',
        workLocation: d.workLocation || '',
        startDate: d.startDate || '',
        isApproved: Boolean(d.isApproved),
        profileComplete: d.profileComplete || false,
        profileStatus: d.profileStatus || 'pending',
        currentStreak: d.currentStreak || 0,
        createdAt: d.createdAt
      };
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ employees, total: employees.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hr/employees/:id — employee detail
router.get('/employees/:id', protect, isApproved, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Employee not found' });
    const data = doc.data();
    if (data.companyId !== req.user.companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ id: doc.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hr/employees/:id — HR updates employee record
router.patch('/employees/:id', protect, isApproved, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Employee not found' });
    if (doc.data().companyId !== req.user.companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = [
      'name',
      'phone',
      'jobRole',
      'department',
      'departmentId',
      'employeeId',
      'employmentType',
      'manager',
      'workLocation',
      'startDate',
      'role',
      'profileStatus'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.approve === true) {
      updates.profileStatus = 'approved';
      updates.isApproved = true;
      updates.approvedBy = req.user.id;
      updates.approvedAt = new Date();
    }

    await db.collection('users').doc(req.params.id).update(updates);
    const updated = await db.collection('users').doc(req.params.id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hr/stats — HR overview stats
router.get('/stats', protect, isApproved, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.json({ totalEmployees: 0, pendingProfiles: 0, activeToday: 0, departments: 0 });
    }

    const snap = await db.collection('users')
      .where('companyId', '==', req.user.companyId)
      .get();

    const employees = snap.docs.map(d => d.data());
    const departments = new Set(employees.map(e => e.departmentId || e.department).filter(Boolean));

    res.json({
      totalEmployees: employees.length,
      pendingProfiles: employees.filter(e => !e.profileComplete || e.profileStatus === 'pending').length,
      approvedEmployees: employees.filter(e => e.profileStatus === 'approved').length,
      departments: departments.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hr/operations-summary — normalized HR workspace payload
router.get('/operations-summary', protect, isApproved, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    if (!req.user.companyId && req.user.role !== 'superadmin') {
      return res.json({ employees: [], departments: [], approvals: [], totalEmployees: 0 });
    }

    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) return res.status(400).json({ error: 'companyId required for superadmin summary' });

    const [usersSnap, companyDoc] = await Promise.all([
      db.collection('users').where('companyId', '==', companyId).get(),
      db.collection('companies').doc(companyId).get()
    ]);

    const employees = usersSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || '',
        email: d.email || '',
        phone: d.phone || '',
        role: d.role || 'member',
        jobRole: d.jobRole || '',
        department: d.department || 'Unassigned',
        departmentId: d.departmentId || 'UNASSIGNED',
        employeeId: d.employeeId || '',
        employmentType: d.employmentType || '',
        manager: d.manager || '',
        workLocation: d.workLocation || '',
        startDate: d.startDate || '',
        profileComplete: Boolean(d.profileComplete),
        profileStatus: d.profileStatus || 'pending',
        isApproved: Boolean(d.isApproved),
        createdAt: d.createdAt
      };
    });

    const departmentsMap = new Map();
    employees.forEach(employee => {
      const key = employee.departmentId || employee.department || 'UNASSIGNED';
      const current = departmentsMap.get(key) || {
        id: key,
        name: employee.department || 'Unassigned',
        headcount: 0,
        pendingProfiles: 0,
        approvedProfiles: 0,
        admins: 0
      };
      current.headcount += 1;
      if (employee.profileStatus === 'approved') current.approvedProfiles += 1;
      if (employee.profileStatus !== 'approved') current.pendingProfiles += 1;
      if (employee.role === 'teamadmin') current.admins += 1;
      departmentsMap.set(key, current);
    });

    res.json({
      company: companyDoc.exists ? { id: companyDoc.id, ...companyDoc.data() } : null,
      employees,
      departments: Array.from(departmentsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      approvals: employees.filter(employee => employee.profileStatus !== 'approved'),
      totalEmployees: employees.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
