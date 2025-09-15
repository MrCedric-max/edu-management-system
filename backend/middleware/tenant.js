// Multi-tenant middleware for data isolation
const db = require('../config/database');

const tenantMiddleware = (req, res, next) => {
  // Skip tenant check for super admin
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }

  // For other users, ensure they can only access their school's data
  if (req.user && req.user.school_id) {
    req.tenant = {
      schoolId: req.user.school_id,
      educationSystem: req.user.education_system || 'anglophone'
    };
  }

  next();
};

// Middleware to add school_id filter to queries
const addTenantFilter = (req, res, next) => {
  if (req.tenant && req.tenant.schoolId) {
    req.tenantFilter = {
      schoolId: req.tenant.schoolId,
      educationSystem: req.tenant.educationSystem
    };
  }
  next();
};

// Helper function to build tenant-aware WHERE clause
const buildTenantWhereClause = (baseWhere = '', tenantFilter) => {
  if (!tenantFilter || !tenantFilter.schoolId) {
    return baseWhere;
  }

  const tenantCondition = `school_id = ${tenantFilter.schoolId}`;
  
  if (baseWhere) {
    return `${baseWhere} AND ${tenantCondition}`;
  } else {
    return `WHERE ${tenantCondition}`;
  }
};

module.exports = {
  tenantMiddleware,
  addTenantFilter,
  buildTenantWhereClause
};
