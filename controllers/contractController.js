const contractModel = require('../models/contractModels');
const websocketService = require('../service/websocketService');
const pool = require('../config/database');

exports.getContracts = async (req, res) => {
  try {
    const { status, client_name, page = 1, limit = 4 } = req.query;
    const filters = { status, client_name };
    console.log('Filters:', filters); // Debugging
    const contracts = await contractModel.getContracts(filters, page, limit);
    console.log('Contracts:', contracts); // Debugging
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error in getContracts:', error.message); // Debugging
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
exports.createContract = async (req, res) => {
  try {
      const { client_name, status = 'Draft', details } = req.body;

      if (!client_name) {
          return res.status(400).json({ error: 'Client name is required' });
      }

      const query = `
          INSERT INTO contracts (client_name, status, details)
          VALUES ($1, $2, $3)
          RETURNING *;
      `;
      const params = [client_name, status, JSON.stringify(details || null)];


      const { rows } = await pool.query(query, params);
      res.status(201).json(rows[0]);
  } catch (error) {
      console.error('Error in createContract:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// exports.createContract = async (req, res) => {
//   try {
//     console.log('Inside createContract'); // Debugging
//     console.log('Request Body:', req.body);
//     console.log('Request Headers:', req.headers);

//     if (!req.body) {
//       console.error('req.body is undefined'); // Debugging
//       return res.status(400).json({ error: 'Request body is missing' });
//     }

//     const { client_name, status, details } = req.body;
//     console.log('Destructured Body:', { client_name, status, details }); // Debugging

//     const contract = await contractModel.createContract(client_name, status, details);
//     res.status(201).json(contract);
//   } catch (error) {
//     console.error('Error in createContract:', error.message);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };





exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await contractModel.getContractById(id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.status(200).json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// exports.updateContract = async (req, res) => {
//   const { id } = req.params;
//   const { client_name, status, details } = req.body;

//   try {
//       const updatedContract = await contractModel.updateContract(id, { client_name, status, details });
//       if (!updatedContract) {
//           return res.status(404).json({ error: 'Contract not found' });
//       }
//       res.json(updatedContract);
//   } catch (error) {
//       console.error('Error updating contract:', error.message);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
exports.updateContract = async (req, res) => {
  let { id } = req.params; // Extract id
  const { client_name, status, details } = req.body;

  // Validate and parse id
  id = parseInt(id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const updatedContract = await contractModel.updateContract(id, { client_name, status, details });
    if (!updatedContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(updatedContract);
  } catch (error) {
    console.error('Error updating contract:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    await contractModel.deleteContract(id);
    websocketService.broadcast('contract_deleted', { id }); // WebSocket notification
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
