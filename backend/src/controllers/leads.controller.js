const pool = require('../db/pool');

const allowedCategories = [
  'product_inquiry',
  'support',
  'partnership',
  'other',
];

const allowedPriorities = ['low', 'normal', 'high'];

const allowedStatuses = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
];

async function createLead(req, res) {
  const {
    full_name,
    email,
    phone,
    company_name,
    source = 'web',
    message,
    category = 'other',
    priority = 'normal',
    follow_up_at,
  } = req.body;

  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({
      error: 'full_name is required and must contain at least 2 characters',
    });
  }

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      error: 'Invalid category',
    });
  }

  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      error: 'Invalid priority',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO leads (
        full_name,
        email,
        phone,
        company_name,
        source,
        message,
        category,
        priority,
        follow_up_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        full_name.trim(),
        email || null,
        phone || null,
        company_name || null,
        source,
        message || null,
        category,
        priority,
        follow_up_at || null,
      ]
    );

    const lead = result.rows[0];

    await pool.query(
      `
      INSERT INTO lead_events (lead_id, event_type, description)
      VALUES ($1, $2, $3)
      `,
      [lead.id, 'created', 'Lead created through the API']
    );

    return res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error.message);

    return res.status(500).json({
      error: 'Unable to create lead',
    });
  }
}

async function listLeads(req, res) {
  const {
    status,
    priority,
    category,
    search,
    limit = 50,
    offset = 0,
  } = req.query;

  const values = [];
  const filters = [];

  if (status) {
    values.push(status);
    filters.push(`l.status = $${values.length}`);
  }

  if (priority) {
    values.push(priority);
    filters.push(`l.priority = $${values.length}`);
  }

  if (category) {
    values.push(category);
    filters.push(`l.category = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    filters.push(`
      (
        l.full_name ILIKE $${values.length}
        OR l.email ILIKE $${values.length}
        OR l.company_name ILIKE $${values.length}
      )
    `);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  values.push(safeLimit);
  const limitParameter = `$${values.length}`;

  values.push(safeOffset);
  const offsetParameter = `$${values.length}`;

  const whereClause = filters.length
    ? `WHERE ${filters.join(' AND ')}`
    : '';

  try {
    const result = await pool.query(
      `
      SELECT
        l.*,
        COUNT(*) OVER() AS total_count
      FROM leads l
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
      `,
      values
    );

    const total = result.rows.length
      ? Number(result.rows[0].total_count)
      : 0;

    const leads = result.rows.map(({ total_count, ...lead }) => lead);

    return res.json({
      data: leads,
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  } catch (error) {
    console.error('List leads error:', error.message);

    return res.status(500).json({
      error: 'Unable to list leads',
    });
  }
}

async function getLeadById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM leads
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Lead not found',
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead error:', error.message);

    return res.status(500).json({
      error: 'Unable to retrieve lead',
    });
  }
}

async function updateLead(req, res) {
  const { id } = req.params;
  const {
    status,
    priority,
    category,
    follow_up_at,
  } = req.body;

  const updates = [];
  const values = [];

  if (status !== undefined) {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
      });
    }

    values.push(status);
    updates.push(`status = $${values.length}`);
  }

  if (priority !== undefined) {
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
      });
    }

    values.push(priority);
    updates.push(`priority = $${values.length}`);
  }

  if (category !== undefined) {
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
      });
    }

    values.push(category);
    updates.push(`category = $${values.length}`);
  }

  if (follow_up_at !== undefined) {
    values.push(follow_up_at || null);
    updates.push(`follow_up_at = $${values.length}`);
  }

  if (!updates.length) {
    return res.status(400).json({
      error: 'No valid fields to update',
    });
  }

  values.push(id);
  const idParameter = `$${values.length}`;

  try {
    const result = await pool.query(
      `
      UPDATE leads
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ${idParameter}
      RETURNING *
      `,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Lead not found',
      });
    }

    const lead = result.rows[0];

    await pool.query(
      `
      INSERT INTO lead_events (lead_id, event_type, description)
      VALUES ($1, $2, $3)
      `,
      [lead.id, 'updated', 'Lead updated through the API']
    );

    return res.json(lead);
  } catch (error) {
    console.error('Update lead error:', error.message);

    return res.status(500).json({
      error: 'Unable to update lead',
    });
  }
}

module.exports = {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
};