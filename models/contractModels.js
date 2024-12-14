const pool = require('../config/database');


// Fetch contract by ID
const getContractById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
  return rows[0];
};

// const createContract = async (client_name, details, status) => {
//   const { rows } = await pool.query(
//     'INSERT INTO contracts (client_name, status,details) VALUES ($1, $2, $3) RETURNING *',
//     [client_name, status || 'Draft',details] // Use JSON.stringify to ensure proper formatting
//   );
//   return rows[0];
// };


const createContract = async (req, res) => {
  try {
    const { client_name, status = 'Draft', details } = req.body;
    const query = `
      INSERT INTO contracts (client_name, status, details)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const params = [client_name, status, details];
    const { rows } = await pool.query(query, params);

    // Emit real-time updates
    io.emit('contracts_updated', { message: 'New contract added', contract: rows[0] });

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error in createContract:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Update an existing contract
const updateContract = async (id, { client_name, status, details }) => {
  const query = `
      UPDATE contracts
      SET client_name = $1, status = $2, details = $3
      WHERE id = $4
      RETURNING *;
  `;
  const params = [client_name, status, details, id];

  const { rows } = await pool.query(query, params);
  return rows[0];
};

// Add Pagination Logic (already present but reinforced)
const getContracts = async (filters, page, limit) => {
  const offset = (page - 1) * limit;

  // Query to fetch contracts with filters, limit, and offset
  const query = `
    SELECT * FROM contracts WHERE
    ($1::text IS NULL OR status = $1) AND
    ($2::text IS NULL OR client_name ILIKE $2)
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4;
  `;

  const countQuery = `
    SELECT COUNT(*) FROM contracts WHERE
    ($1::text IS NULL OR status = $1) AND
    ($2::text IS NULL OR client_name ILIKE $2);
  `;

  const params = [
    filters.status || null,
    filters.client_name ? `%${filters.client_name}%` : null,
    limit,
    offset
  ];

  try {
    const { rows: contracts } = await pool.query(query, params);
    const { rows: countRows } = await pool.query(countQuery, [
      filters.status || null,
      filters.client_name ? `%${filters.client_name}%` : null
    ]);

    const totalCount = parseInt(countRows[0].count, 10);

    return { contracts, totalCount };
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
};


// Delete a contract
const deleteContract = async (id) => {
  await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
};
