const executeCode = async (req, res) => {
  const { code } = req.body;

  try {
    // Currently as it is will replace with docker later
    const result = eval(code);

    res.json({ output: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export { executeCode };
